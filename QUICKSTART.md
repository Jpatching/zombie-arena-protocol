# 🎮 Zombie Arena Protocol - Quick Start Guide

## 🚀 One-Command Setup (Linux/Mac)

```bash
# Clone and setup everything
git clone https://github.com/yourusername/zombie-arena-protocol.git
cd zombie-arena-protocol
./scripts/setup-local.sh
```

This will:
1. ✅ Check all prerequisites
2. 🏭 Start local Solana validator
3. 💰 Deploy smart contracts
4. 🪙 Create $ZAP token
5. 🌐 Start backend server
6. 🎮 Launch frontend

**Game will be available at: http://localhost:3000**

## 🔧 Manual Setup

### 1. Install Dependencies

```bash
# Install all packages
npm install
```

### 2. Start Local Blockchain

```bash
# Terminal 1
solana-test-validator

# Terminal 2
solana config set --url localhost
solana airdrop 10
```

### 3. Deploy Contracts

```bash
cd contracts
anchor build
anchor deploy
```

### 4. Start Services

```bash
# Terminal 3 - Backend
cd backend
npm run dev

# Terminal 4 - Frontend
cd frontend
npm run dev
```

## 🎮 How to Play

### 1. Connect Wallet
- Open http://localhost:3000
- Click "Select Wallet"
- Use Phantom or Solflare

### 2. Start Playing
- Choose "SOLO SURVIVAL" or "MULTIPLAYER MAYHEM"
- Use WASD to move
- Mouse to aim and shoot
- SPACE to jump
- SHIFT to sprint

### 3. Game Controls
- **B** - Open Perk Shop
- **M** - Mystery Box
- **ESC** - Pause Menu
- **R** - Reload
- **F** - Interact

### 4. Earn $ZAP Tokens
- Kill zombies: 5 $ZAP
- Headshots: 10 $ZAP
- Round completion: 100 × round number
- Daily challenges: Variable

## 🧪 Testing Features

### Give Yourself Tokens (Dev Only)
```bash
# In browser console
localStorage.setItem('devMode', 'true');
// Press Ctrl+Shift+T in game for 10,000 $ZAP
```

### Skip to Round
```bash
# In browser console while in game
gameEngine.skipToRound(10);
```

### Spawn Weapon
```bash
# In browser console
gameEngine.giveWeapon('raygun');
```

## 📝 Branding Customization

### Update Logo
1. Add your logo to `frontend/public/logo.png`
2. Update favicon at `frontend/public/favicon.ico`

### Change Colors
Edit `frontend/tailwind.config.js`:
```javascript
colors: {
  'zap-red': '#YOUR_RED',
  'zap-dark': '#YOUR_DARK',
  'zap-gold': '#YOUR_GOLD',
}
```

### Update Game Title
Edit `frontend/components/MainMenu.tsx`:
```typescript
<h1>YOUR GAME TITLE</h1>
```

## 🌐 Production Deployment

### Deploy to Mainnet
```bash
# Switch to mainnet
solana config set --url mainnet-beta

# Deploy contracts
cd contracts
anchor deploy --provider.cluster mainnet
```

### Deploy Frontend
```bash
# Vercel
vercel --prod

# Or Netlify
netlify deploy --prod
```

### Deploy Backend
```bash
# Railway
railway up

# Or Heroku
heroku create zap-backend
git push heroku main
```

## 🎆 Pump.fun Launch Steps

1. **Prepare Assets**
   - Logo (512x512 PNG)
   - Banner (1500x500 PNG)
   - Description (< 1000 chars)

2. **Launch Token**
   - Visit pump.fun/create
   - Connect deployer wallet
   - Set supply: 1,000,000,000
   - Enable fair launch

3. **Update Contracts**
   ```bash
   # Update token mint in contracts
   anchor run update-token-mint -- --mint <PUMP_FUN_MINT>
   ```

4. **Go Live**
   - Share on Twitter
   - Post in Discord
   - Enable trading

## 🐛 Common Issues

### "Wallet not connected"
- Install Phantom extension
- Switch to Devnet in wallet settings
- Refresh page

### "Transaction failed"
- Check you have SOL for fees
- Ensure contracts are deployed
- Check browser console

### "Game not loading"
- Enable WebGL in browser
- Clear cache (Ctrl+Shift+R)
- Check all services running

## 📞 Support

- Discord: discord.gg/zapprotocol
- Twitter: @ZombieArenaSOL
- Email: support@zombiearena.io

---

**Ready to survive the zombie apocalypse and earn $ZAP? Let's go! 🧟💰**