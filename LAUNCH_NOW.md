# 🎮 LAUNCH ZOMBIE ARENA PROTOCOL - 3 WAYS TO PLAY NOW!

## Option 1: 🔥 Instant Play (Easiest - 1 Command)

```bash
# Just run this:
./launch-game.sh
```

This will:
- Start the game in demo mode
- Open browser automatically
- Let you play immediately (no wallet needed for demo)

## Option 2: 🐳 Docker Launch (Full Experience)

```bash
# Start all services with Docker:
docker-compose up
```

Then open: http://localhost:3000

## Option 3: 🚀 Deploy to GitHub (Production)

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Name: `zombie-arena-protocol`
3. Create repository

### Step 2: Push Code

```bash
# Initialize and push
git init
git add .
git commit -m "Initial commit: Zombie Arena Protocol"
git remote add origin https://github.com/YOUR_USERNAME/zombie-arena-protocol.git
git push -u origin main
```

### Step 3: Deploy with GitHub Actions

1. Go to your repo Settings > Secrets and variables > Actions
2. Add these secrets:

```yaml
# Required for deployment:
VERCEL_TOKEN: <get from vercel.com/account/tokens>
VERCEL_ORG_ID: <your vercel org id>
VERCEL_PROJECT_ID: <create project first>

# For full deployment (optional for now):
DEPLOY_WALLET: <solana wallet private key>
SOLANA_RPC_URL: https://api.devnet.solana.com
RAILWAY_TOKEN: <from railway dashboard>
MONGODB_URI: mongodb+srv://...
REDIS_URL: redis://...
BACKEND_URL: https://your-backend.railway.app
FRONTEND_URL: https://your-app.vercel.app
```

3. Enable Actions and run the deployment workflow

### Step 4: Quick Vercel Deploy (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel
```

Follow prompts and your game will be live!

## 🎮 Game Controls

- **WASD** - Move
- **Mouse** - Aim/Shoot  
- **SPACE** - Jump
- **SHIFT** - Sprint
- **B** - Buy Perks
- **M** - Mystery Box
- **ESC** - Pause

## 🧙 Demo Mode Cheats

- **Ctrl+Shift+T** - Get 10,000 $ZAP tokens
- **Ctrl+Shift+P** - Unlock all perks
- **Ctrl+Shift+W** - Get Ray Gun

## 📱 Quick Links

- **Local Game**: http://localhost:3000
- **GitHub**: https://github.com/YOUR_USERNAME/zombie-arena-protocol
- **Live Demo**: https://zombie-arena-protocol.vercel.app (after deploy)

## ⚡ Troubleshooting

**"Command not found"**
```bash
chmod +x launch-game.sh
./launch-game.sh
```

**"Port already in use"**
```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**"Module not found"**
```bash
npm install
cd frontend && npm install
```

---

**Ready? Run `./launch-game.sh` and start surviving! 🧟💰**