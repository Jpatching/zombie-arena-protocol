# 🧟 Zombie Arena Protocol (ZAP)

> A Solana-based crypto zombie survival game inspired by Call of Duty Zombies, built for Pump.fun launch

![ZAP Banner](https://placeholder.com/banner.png)

## 🎮 Overview

Zombie Arena Protocol (ZAP) is a web-based multiplayer zombie survival game that integrates Solana blockchain mechanics. Players earn $ZAP tokens by surviving rounds, eliminating zombies, and completing challenges. The game features NFT weapons, tournaments, and a deflationary token economy.

### Key Features

- 🔫 **Classic Zombie Survival**: Round-based gameplay inspired by CoD Zombies
- 💰 **Play-to-Earn**: Earn $ZAP tokens for kills, rounds, and achievements
- 🎯 **NFT Weapons**: Collect and trade unique weapon NFTs from mystery boxes
- 🏆 **Tournaments**: Compete in decentralized tournaments for prizes
- 👥 **Guilds**: Team up and share resources with other players
- 🚀 **Fair Launch**: Launching on Pump.fun with no presale or team allocation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Blockchain**: Solana, Anchor Framework, Metaplex
- **Game Engine**: WebGL (Three.js), Cannon-es Physics
- **Multiplayer**: Socket.io, WebRTC
- **Backend**: Node.js, Express, Redis, MongoDB
- **Testing**: Playwright

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust & Cargo
- Solana CLI
- Anchor CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zombie-arena-protocol.git
cd zombie-arena-protocol

# Install dependencies
npm install

# Install contract dependencies
cd contracts && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Development

```bash
# Start local Solana validator
solana-test-validator

# Deploy contracts (in another terminal)
cd contracts
anchor build
anchor deploy

# Start backend server
cd ../backend
npm run dev

# Start frontend (in another terminal)
cd ../frontend
npm run dev
```

Visit http://localhost:3000 to play!

## 🎯 Game Mechanics

### Rounds System
- Progressive difficulty with increasing zombie health and speed
- Zombie count formula: 
  - Rounds 1-5: `6 + (round - 1) * 2`
  - Rounds 6+: `24 + (round - 5) * 3`

### Token Economy
- **Earn $ZAP**:
  - Zombie kill: 5 $ZAP
  - Headshot: 10 $ZAP
  - Round survival: 100 * round number
  - Daily challenges: Variable rewards

- **Spend $ZAP**:
  - Perks: 2500-5000 $ZAP
  - Mystery Box: 950 $ZAP
  - Pack-a-Punch: 5000 $ZAP
  - Tournament entry: Variable

### Perks
1. **Juggernog** (2500 $ZAP): 250 health
2. **Speed Cola** (3000 $ZAP): Faster reload
3. **Double Tap** (2000 $ZAP): Increased fire rate
4. **Quick Revive** (1500 $ZAP): Faster revive
5. **Stamin-Up** (2000 $ZAP): Increased movement speed

### NFT Weapons
- **Rarities**: Common, Uncommon, Rare, Epic, Legendary, Mythic
- **Damage Multipliers**: 1.0x to 3.0x based on rarity
- **Pack-a-Punch**: Double damage, costs 5000 $ZAP (burns tokens)

## 🏗️ Architecture

```
zombie-arena-protocol/
├── frontend/          # Next.js React app
├── contracts/         # Solana smart contracts
├── backend/           # Node.js game server
├── game-engine/       # WebGL game engine
└── tests/            # Playwright E2E tests
```

### Smart Contracts

1. **Token Contract**: SPL token with burn mechanics
2. **NFT Contract**: Weapon NFTs using Metaplex
3. **Tournament Contract**: Prize pool management
4. **Guild Contract**: Team treasury and management

## 🚢 Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy to Vercel
vercel --prod
```

### Backend
```bash
cd backend
npm run build
# Deploy to Railway
railway up
```

### Contracts
```bash
cd contracts
anchor build
anchor deploy --provider.cluster mainnet
```

## 🎮 Pump.fun Launch Strategy

1. **Fair Launch**: No presales, team must buy like everyone else
2. **Initial Supply**: 1,000,000,000 $ZAP
3. **Launch Price**: ~$0.00001 per token
4. **Liquidity**: Locked through gameplay milestones
5. **Deflationary**: Tokens burned for perks and upgrades

## 🧪 Testing

```bash
# Run Playwright tests
cd tests
npm test

# Run with UI
npm run test:ui
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📜 License

MIT License - see LICENSE file for details

## 🔗 Links

- Website: https://zombiearena.io
- Twitter: @ZombieArenaSOL
- Discord: discord.gg/zapprotocol
- Docs: https://docs.zombiearena.io

---

**⚠️ Disclaimer**: This is a game that involves cryptocurrency. Play responsibly and never invest more than you can afford to lose.