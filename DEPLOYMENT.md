# 🚀 Zombie Arena Protocol - Deployment Guide

## Prerequisites

1. **Install Required Tools**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 🏗️ Local Development Setup

### 1. Start Local Blockchain
```bash
# Terminal 1: Start local Solana validator
solana-test-validator

# Terminal 2: Configure Solana CLI
solana config set --url localhost
solana airdrop 10  # Get test SOL
```

### 2. Deploy Smart Contracts
```bash
cd contracts

# Build contracts
anchor build

# Get your program ID
solana address -k target/deploy/zombie_arena_protocol-keypair.json

# Update the program ID in Anchor.toml and lib.rs
# Replace "ZAPxxx111111111111111111111111111111111111" with your actual program ID

# Deploy
anchor deploy

# Run tests
anchor test --skip-local-validator
```

### 3. Configure Environment Variables

**Backend (.env)**:
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
CLIENT_URL=http://localhost:3000
SOLANA_RPC_URL=http://localhost:8899
MONGODB_URI=mongodb://localhost:27017/zap
REDIS_URL=redis://localhost:6379
PROGRAM_ID=<YOUR_PROGRAM_ID>
TOKEN_MINT=<YOUR_TOKEN_MINT_ADDRESS>
```

**Frontend (.env.local)**:
```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SOLANA_RPC_URL=http://localhost:8899
NEXT_PUBLIC_PROGRAM_ID=<YOUR_PROGRAM_ID>
NEXT_PUBLIC_TOKEN_MINT=<YOUR_TOKEN_MINT_ADDRESS>
```

### 4. Start Services

```bash
# Terminal 3: Start MongoDB
mongod

# Terminal 4: Start Redis
redis-server

# Terminal 5: Start Backend
cd backend
npm install
npm run dev

# Terminal 6: Start Frontend
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000 to play!

## 🎮 Testing the Game

1. **Connect Wallet**:
   - Click "Select Wallet" button
   - Choose Phantom or Solflare
   - Approve connection

2. **Initialize Token**:
   ```bash
   # Create token mint and initialize
   cd contracts
   anchor run initialize-token
   ```

3. **Test Game Features**:
   - Start Solo Survival
   - Kill zombies to earn tokens
   - Buy perks with B key
   - Use mystery box with M key

## 🌐 Production Deployment

### 1. Deploy to Solana Mainnet

```bash
# Switch to mainnet
solana config set --url https://api.mainnet-beta.solana.com

# Deploy contracts
cd contracts
anchor build
anchor deploy --provider.cluster mainnet

# Save your program ID and token mint address!
```

### 2. Deploy Backend to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
cd backend
railway init

# Set environment variables
railway variables set PORT=3001
railway variables set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
railway variables set PROGRAM_ID=<YOUR_MAINNET_PROGRAM_ID>
railway variables set TOKEN_MINT=<YOUR_MAINNET_TOKEN_MINT>

# Deploy
railway up
```

### 3. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SERVER_URL = https://your-railway-app.railway.app
# NEXT_PUBLIC_SOLANA_RPC_URL = https://api.mainnet-beta.solana.com
# NEXT_PUBLIC_PROGRAM_ID = <YOUR_MAINNET_PROGRAM_ID>
# NEXT_PUBLIC_TOKEN_MINT = <YOUR_MAINNET_TOKEN_MINT>
```

## 🎨 Branding Checklist

### Update Logo and Assets
1. Replace `/frontend/public/logo.png` with ZAP logo
2. Update `/frontend/public/favicon.ico`
3. Add zombie-themed backgrounds in `/frontend/public/backgrounds/`

### Update Metadata
1. Edit `/frontend/app/layout.tsx` - Update title and description
2. Update `/frontend/public/manifest.json` with app details
3. Add Open Graph images in `/frontend/public/`

### Update Colors
Edit `/frontend/tailwind.config.js` to match ZAP theme:
```javascript
colors: {
  'zap-red': '#DC2626',
  'zap-dark': '#1A1A1A',
  'zap-gold': '#FFD700',
}
```

## 🚀 Pump.fun Launch

### 1. Prepare Token Launch
```bash
# Generate new token mint keypair
solana-keygen new -o token-mint.json

# Get the public key
solana address -k token-mint.json
```

### 2. Launch on Pump.fun
1. Visit https://pump.fun/create
2. Connect your wallet
3. Fill in token details:
   - Name: Zombie Arena Protocol
   - Symbol: ZAP
   - Description: Survive. Earn. Dominate.
   - Image: Upload ZAP logo
   - Twitter: @ZombieArenaSOL
   - Telegram: t.me/zombiearenaprotocol
   - Website: https://zombiearena.io

4. Set tokenomics:
   - Total Supply: 1,000,000,000
   - No team allocation
   - Fair launch enabled

### 3. Post-Launch Actions
1. Update contract with Pump.fun token address
2. Add liquidity through gameplay rewards
3. Enable burning mechanics
4. Start marketing campaign

## 🧪 Run Tests

```bash
# Run Playwright tests
cd tests
npm install
npm test

# Run specific test suites
npm test wallet-connection
npm test game-mechanics
npm test blockchain-integration
```

## 📊 Monitoring

### Backend Health Check
```bash
curl http://localhost:3001/health
```

### Check Token Supply
```bash
spl-token supply <TOKEN_MINT_ADDRESS>
```

### Monitor Game Stats
Visit http://localhost:3001/api/leaderboard

## 🔧 Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure wallet extension is installed
   - Check RPC endpoint is correct
   - Verify browser console for errors

2. **Token Transactions Failing**
   - Check program ID matches deployed contract
   - Ensure wallet has SOL for fees
   - Verify token mint address

3. **Game Not Loading**
   - Check WebGL support in browser
   - Clear browser cache
   - Verify all services are running

### Debug Commands
```bash
# Check program logs
solana logs <PROGRAM_ID>

# Check account balance
solana balance

# View token accounts
spl-token accounts
```

## 🎯 Launch Checklist

- [ ] Smart contracts deployed and verified
- [ ] Backend API endpoints tested
- [ ] Frontend responsive on all devices
- [ ] Wallet integration working
- [ ] Token minting/burning tested
- [ ] NFT weapons generating correctly
- [ ] Multiplayer synchronization verified
- [ ] Pump.fun metadata prepared
- [ ] Social media accounts created
- [ ] Documentation complete
- [ ] Security audit completed

---

**Need Help?** Join our Discord: discord.gg/zapprotocol