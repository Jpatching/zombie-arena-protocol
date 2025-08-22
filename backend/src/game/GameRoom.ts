import { Server, Socket } from 'socket.io';
import { WeaponType, WeaponRarity } from './types';

interface Player {
  id: string;
  socket: Socket;
  position: { x: number; y: number; z: number };
  health: number;
  score: number;
  kills: number;
  perks: string[];
}

export class GameRoom {
  private players: Map<string, Player> = new Map();
  private zombieCount: number = 0;
  private currentRound: number = 1;
  private isRoundActive: boolean = false;
  private maxPlayers: number = 4;
  
  constructor(
    private roomId: string,
    private io: Server
  ) {}
  
  public addPlayer(socket: Socket): void {
    if (this.players.size >= this.maxPlayers) {
      socket.emit('roomFull');
      return;
    }
    
    const player: Player = {
      id: socket.id,
      socket,
      position: { x: 0, y: 5, z: 0 },
      health: 100,
      score: 0,
      kills: 0,
      perks: []
    };
    
    this.players.set(socket.id, player);
    
    // Notify other players
    socket.to(this.roomId).emit('playerJoined', {
      playerId: socket.id,
      position: player.position
    });
    
    // Send current game state to new player
    socket.emit('gameState', {
      players: Array.from(this.players.entries()).map(([id, p]) => ({
        id,
        position: p.position,
        health: p.health
      })),
      round: this.currentRound,
      zombieCount: this.zombieCount
    });
    
    // Start game if enough players
    if (this.players.size >= 2 && !this.isRoundActive) {
      this.startRound();
    }
  }
  
  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.io.to(this.roomId).emit('playerLeft', { playerId });
  }
  
  public handlePlayerMove(playerId: string, data: any): void {
    const player = this.players.get(playerId);
    if (player) {
      player.position = data.position;
      
      // Broadcast to other players
      player.socket.to(this.roomId).emit('playerMoved', {
        playerId,
        position: data.position,
        rotation: data.rotation
      });
    }
  }
  
  public handlePlayerShoot(playerId: string, data: any): void {
    const player = this.players.get(playerId);
    if (player) {
      // Broadcast shot to other players
      player.socket.to(this.roomId).emit('playerShot', {
        playerId,
        origin: data.origin,
        direction: data.direction,
        weapon: data.weapon
      });
    }
  }
  
  public handleZombieKill(playerId: string, data: any): any {
    const player = this.players.get(playerId);
    if (!player) return { tokensEarned: 0 };
    
    player.kills++;
    this.zombieCount--;
    
    // Calculate rewards
    const baseReward = data.isHeadshot ? 10 : 5;
    const roundMultiplier = Math.floor(this.currentRound / 5) + 1;
    const tokensEarned = baseReward * roundMultiplier;
    
    // Update score
    const points = data.isHeadshot ? 100 : 50;
    player.score += points;
    
    // Broadcast kill to all players
    this.io.to(this.roomId).emit('zombieKilled', {
      playerId,
      zombieId: data.zombieId,
      isHeadshot: data.isHeadshot,
      points
    });
    
    // Check round completion
    if (this.zombieCount === 0 && this.isRoundActive) {
      this.endRound();
    }
    
    return {
      tokensEarned,
      reason: data.isHeadshot ? 'headshot' : 'kill'
    };
  }
  
  public activatePerk(playerId: string, perkType: string): void {
    const player = this.players.get(playerId);
    if (player && !player.perks.includes(perkType)) {
      player.perks.push(perkType);
      
      // Apply perk effects
      switch(perkType) {
        case 'juggernog':
          player.health = 250;
          break;
      }
      
      // Notify all players
      this.io.to(this.roomId).emit('perkActivated', {
        playerId,
        perkType
      });
    }
  }
  
  public rollMysteryBox(): any {
    // Weapon probabilities
    const weaponPool = [
      { type: WeaponType.AK47, rarity: WeaponRarity.Common, weight: 30 },
      { type: WeaponType.M16, rarity: WeaponRarity.Common, weight: 30 },
      { type: WeaponType.MP40, rarity: WeaponRarity.Uncommon, weight: 20 },
      { type: WeaponType.Galil, rarity: WeaponRarity.Rare, weight: 10 },
      { type: WeaponType.FAMAS, rarity: WeaponRarity.Rare, weight: 5 },
      { type: WeaponType.Raygun, rarity: WeaponRarity.Legendary, weight: 3 },
      { type: WeaponType.Thundergun, rarity: WeaponRarity.Mythic, weight: 1 },
      { type: WeaponType.WunderWaffe, rarity: WeaponRarity.Mythic, weight: 1 }
    ];
    
    // Calculate total weight
    const totalWeight = weaponPool.reduce((sum, weapon) => sum + weapon.weight, 0);
    
    // Roll
    let random = Math.random() * totalWeight;
    
    for (const weapon of weaponPool) {
      random -= weapon.weight;
      if (random <= 0) {
        return {
          type: weapon.type,
          rarity: weapon.rarity
        };
      }
    }
    
    // Fallback
    return {
      type: WeaponType.AK47,
      rarity: WeaponRarity.Common
    };
  }
  
  public completeRound(playerId: string, data: any): any {
    const player = this.players.get(playerId);
    if (!player) return {};
    
    return {
      round: this.currentRound,
      kills: player.kills,
      score: player.score,
      survivalTime: data.survivalTime
    };
  }
  
  private startRound(): void {
    this.currentRound++;
    this.isRoundActive = true;
    this.zombieCount = this.calculateZombieCount();
    
    // Notify all players
    this.io.to(this.roomId).emit('roundStart', {
      round: this.currentRound,
      zombieCount: this.zombieCount
    });
  }
  
  private endRound(): void {
    this.isRoundActive = false;
    
    // Calculate round bonus
    const roundBonus = 100 * this.currentRound;
    
    // Award bonus to all surviving players
    this.players.forEach((player) => {
      if (player.health > 0) {
        player.socket.emit('roundComplete', {
          round: this.currentRound,
          bonus: roundBonus
        });
      }
    });
    
    // Start next round after delay
    setTimeout(() => {
      if (this.players.size > 0) {
        this.startRound();
      }
    }, 10000);
  }
  
  private calculateZombieCount(): number {
    if (this.currentRound <= 5) {
      return 6 + (this.currentRound - 1) * 2;
    } else {
      return 24 + (this.currentRound - 5) * 3;
    }
  }
  
  public hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }
  
  public isEmpty(): boolean {
    return this.players.size === 0;
  }
  
  public getId(): string {
    return this.roomId;
  }
}