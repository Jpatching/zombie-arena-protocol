import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { GameRoom } from './game/GameRoom';
import { MatchmakingService } from './services/MatchmakingService';
import { TokenService } from './services/TokenService';
import { DatabaseService } from './services/DatabaseService';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Services
const matchmaking = new MatchmakingService();
const tokenService = new TokenService();
const database = new DatabaseService();

// Active game rooms
const gameRooms = new Map<string, GameRoom>();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Handle player authentication
  socket.on('authenticate', async (data) => {
    const { walletAddress, signature } = data;
    
    try {
      // Verify wallet signature
      const isValid = await tokenService.verifyWalletSignature(walletAddress, signature);
      if (!isValid) {
        socket.emit('authError', { message: 'Invalid signature' });
        return;
      }
      
      // Store player data
      socket.data.walletAddress = walletAddress;
      socket.data.playerId = `player_${socket.id}`;
      
      // Get player state from blockchain
      const playerState = await tokenService.getPlayerState(walletAddress);
      socket.emit('authenticated', { playerState });
      
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('authError', { message: 'Authentication failed' });
    }
  });
  
  // Handle matchmaking
  socket.on('findMatch', async (data) => {
    const { mode = 'classic' } = data;
    
    try {
      const room = await matchmaking.findOrCreateRoom(mode);
      const gameRoom = gameRooms.get(room.id) || new GameRoom(room.id, io);
      
      if (!gameRooms.has(room.id)) {
        gameRooms.set(room.id, gameRoom);
      }
      
      gameRoom.addPlayer(socket);
      socket.join(room.id);
      socket.emit('matchFound', { roomId: room.id });
      
    } catch (error) {
      console.error('Matchmaking error:', error);
      socket.emit('matchmakingError', { message: 'Failed to find match' });
    }
  });
  
  // Handle game events
  socket.on('playerMove', (data) => {
    const room = getPlayerRoom(socket);
    if (room) {
      room.handlePlayerMove(socket.id, data);
    }
  });
  
  socket.on('playerShoot', (data) => {
    const room = getPlayerRoom(socket);
    if (room) {
      room.handlePlayerShoot(socket.id, data);
    }
  });
  
  socket.on('zombieKilled', async (data) => {
    const room = getPlayerRoom(socket);
    if (room) {
      const result = room.handleZombieKill(socket.id, data);
      
      // Award tokens on-chain
      if (result.tokensEarned > 0) {
        try {
          await tokenService.rewardPlayer(
            socket.data.walletAddress,
            result.tokensEarned,
            result.reason
          );
          socket.emit('tokensEarned', result);
        } catch (error) {
          console.error('Token reward error:', error);
        }
      }
    }
  });
  
  socket.on('buyPerk', async (data) => {
    const { perkType, cost } = data;
    const room = getPlayerRoom(socket);
    
    if (room) {
      try {
        // Process blockchain transaction
        const txHash = await tokenService.burnTokensForPerk(
          socket.data.walletAddress,
          cost,
          perkType
        );
        
        // Update game state
        room.activatePerk(socket.id, perkType);
        socket.emit('perkActivated', { perkType, txHash });
        
      } catch (error) {
        console.error('Perk purchase error:', error);
        socket.emit('perkError', { message: 'Failed to purchase perk' });
      }
    }
  });
  
  socket.on('mysteryBox', async (data) => {
    const room = getPlayerRoom(socket);
    
    if (room) {
      try {
        // Roll for weapon
        const weapon = room.rollMysteryBox();
        
        // Mint NFT on blockchain
        const nft = await tokenService.mintWeaponNFT(
          socket.data.walletAddress,
          weapon
        );
        
        socket.emit('mysteryBoxResult', { weapon, nft });
        
      } catch (error) {
        console.error('Mystery box error:', error);
        socket.emit('mysteryBoxError', { message: 'Failed to roll mystery box' });
      }
    }
  });
  
  socket.on('roundComplete', async (data) => {
    const room = getPlayerRoom(socket);
    
    if (room) {
      const stats = room.completeRound(socket.id, data);
      
      // Save stats to database
      await database.saveRoundStats(socket.data.walletAddress, stats);
      
      // Award round completion bonus
      const bonus = stats.round * 100;
      await tokenService.rewardPlayer(
        socket.data.walletAddress,
        bonus,
        'round_complete'
      );
      
      socket.emit('roundStats', { ...stats, bonus });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    const room = getPlayerRoom(socket);
    if (room) {
      room.removePlayer(socket.id);
      
      // Clean up empty rooms
      if (room.isEmpty()) {
        gameRooms.delete(room.getId());
      }
    }
  });
});

// Helper function to get player's room
function getPlayerRoom(socket: any): GameRoom | undefined {
  for (const [roomId, room] of gameRooms) {
    if (room.hasPlayer(socket.id)) {
      return room;
    }
  }
  return undefined;
}

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await database.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/player/:walletAddress', async (req, res) => {
  try {
    const stats = await database.getPlayerStats(req.params.walletAddress);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

app.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await tokenService.getActiveTournaments();
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});