#!/bin/bash

# Setup GitHub repository for Zombie Arena Protocol

echo "🚀 Setting up GitHub repository for Zombie Arena Protocol"

# Initialize git if not already
if [ ! -d ".git" ]; then
    git init
    echo "Initialized git repository"
fi

# Create initial commit
git add .
git commit -m "Initial commit: Zombie Arena Protocol - Solana crypto zombie survival game"

# Instructions for GitHub setup
echo ""
echo "📝 Follow these steps to deploy on GitHub:"
echo ""
echo "1. Create a new repository on GitHub:"
echo "   https://github.com/new"
echo "   Name: zombie-arena-protocol"
echo "   Description: Solana-based crypto zombie survival game"
echo ""
echo "2. Add the remote:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/zombie-arena-protocol.git"
echo ""
echo "3. Push the code:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "4. Set up GitHub Secrets (Settings > Secrets and variables > Actions):"
echo "   Required secrets:"
echo "   - DEPLOY_WALLET: Your Solana wallet private key (base58)"
echo "   - SOLANA_RPC_URL: https://api.mainnet-beta.solana.com"
echo "   - VERCEL_TOKEN: Get from https://vercel.com/account/tokens"
echo "   - VERCEL_ORG_ID: Your Vercel org ID"
echo "   - VERCEL_PROJECT_ID: Your Vercel project ID"
echo "   - RAILWAY_TOKEN: Get from Railway dashboard"
echo "   - MONGODB_URI: Your MongoDB connection string"
echo "   - REDIS_URL: Your Redis connection string"
echo "   - BACKEND_URL: Your deployed backend URL"
echo "   - FRONTEND_URL: Your deployed frontend URL"
echo ""
echo "5. Enable GitHub Actions:"
echo "   Go to Actions tab and enable workflows"
echo ""
echo "6. Trigger deployment:"
echo "   git push origin main"
echo "   OR"
echo "   Go to Actions > Deploy Zombie Arena Protocol > Run workflow"
echo ""
echo "7. For Pump.fun launch:"
echo "   After deployment, run the 'Launch on Pump.fun' workflow"
echo ""

# Create a deployment checklist
cat > DEPLOY_CHECKLIST.md << 'EOL'
# Deployment Checklist for Zombie Arena Protocol

## Pre-Deployment
- [ ] Update logo and branding assets
- [ ] Configure environment variables
- [ ] Test locally with `./launch-game.sh`
- [ ] Run tests with `npm test`

## GitHub Setup
- [ ] Create GitHub repository
- [ ] Add all required secrets
- [ ] Enable GitHub Actions
- [ ] Push code to trigger deployment

## Vercel Setup
- [ ] Create Vercel project
- [ ] Link to GitHub repo
- [ ] Set environment variables
- [ ] Configure custom domain (optional)

## Railway Setup  
- [ ] Create Railway project
- [ ] Add MongoDB and Redis
- [ ] Deploy backend service
- [ ] Note the backend URL

## Solana Mainnet
- [ ] Fund deployment wallet with SOL
- [ ] Deploy contracts to mainnet
- [ ] Initialize token
- [ ] Verify on Solscan

## Pump.fun Launch
- [ ] Prepare 512x512 logo
- [ ] Write token description
- [ ] Set fair launch parameters
- [ ] Launch token
- [ ] Update contract with token address

## Post-Launch
- [ ] Share on Twitter
- [ ] Post in Discord
- [ ] Monitor game metrics
- [ ] Engage with community

## Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics
- [ ] Monitor RPC usage
- [ ] Track token metrics
EOL

echo ""
echo "✅ Setup complete! Check DEPLOY_CHECKLIST.md for next steps."
echo ""
echo "🎮 To test locally first: ./launch-game.sh"