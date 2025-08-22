#!/bin/bash

# Zombie Arena Protocol - Local Setup Script

echo "🧟 Starting Zombie Arena Protocol Local Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v solana &> /dev/null; then
    echo -e "${RED}Solana CLI is not installed. Please install Solana CLI${NC}"
    exit 1
fi

if ! command -v anchor &> /dev/null; then
    echo -e "${RED}Anchor is not installed. Please install Anchor${NC}"
    exit 1
fi

if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}MongoDB is not installed. Installing...${NC}"
    # Add MongoDB installation based on OS
fi

if ! command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}Redis is not installed. Installing...${NC}"
    # Add Redis installation based on OS
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"

# Start services
echo -e "${YELLOW}Starting services...${NC}"

# Start Solana validator
echo "Starting Solana validator..."
solana-test-validator --reset &
SOLANA_PID=$!
sleep 5

# Configure Solana
solana config set --url localhost
solana airdrop 10

# Start MongoDB
echo "Starting MongoDB..."
mongod --dbpath ./data/db &
MONGO_PID=$!

# Start Redis
echo "Starting Redis..."
redis-server &
REDIS_PID=$!

echo -e "${GREEN}✓ Services started${NC}"

# Deploy contracts
echo -e "${YELLOW}Deploying smart contracts...${NC}"
cd contracts
anchor build
anchor deploy

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/zombie_arena_protocol-keypair.json)
echo -e "${GREEN}Program deployed at: $PROGRAM_ID${NC}"

# Initialize token
echo -e "${YELLOW}Initializing $ZAP token...${NC}"
cd ../scripts
ts-node initialize-token.ts

# Read token mint from config
if [ -f "zap-config.json" ]; then
    TOKEN_MINT=$(jq -r '.tokenMint' zap-config.json)
    echo -e "${GREEN}Token mint: $TOKEN_MINT${NC}"
fi

# Setup environment files
echo -e "${YELLOW}Setting up environment files...${NC}"

# Backend .env
cd ../backend
cp .env.example .env
sed -i "s/YOUR_PROGRAM_ID_HERE/$PROGRAM_ID/g" .env
sed -i "s/YOUR_TOKEN_MINT_ADDRESS_HERE/$TOKEN_MINT/g" .env

# Frontend .env.local
cd ../frontend
cp .env.example .env.local
sed -i "s/YOUR_PROGRAM_ID_HERE/$PROGRAM_ID/g" .env.local
sed -i "s/YOUR_TOKEN_MINT_ADDRESS_HERE/$TOKEN_MINT/g" .env.local

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
cd ..
npm install --workspaces

# Start backend
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}🎉 Zombie Arena Protocol is running!${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend: http://localhost:3001${NC}"
echo -e "${GREEN}Program ID: $PROGRAM_ID${NC}"
echo -e "${GREEN}Token Mint: $TOKEN_MINT${NC}"

# Save PIDs for cleanup
echo "SOLANA_PID=$SOLANA_PID" > .pids
echo "MONGO_PID=$MONGO_PID" >> .pids
echo "REDIS_PID=$REDIS_PID" >> .pids
echo "BACKEND_PID=$BACKEND_PID" >> .pids
echo "FRONTEND_PID=$FRONTEND_PID" >> .pids

echo -e "${YELLOW}\nTo stop all services, run: ./scripts/stop-local.sh${NC}"

# Keep script running
wait