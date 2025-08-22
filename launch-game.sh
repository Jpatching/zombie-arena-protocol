#!/bin/bash

# 🧟 Zombie Arena Protocol - Quick Launch Script

echo ""
echo "  🧟 ZOMBIE ARENA PROTOCOL 🧟"
echo "  Survive. Earn. Dominate."
echo ""
echo "  Starting game services..."
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Using Docker for quick setup..."
    docker-compose up -d
    
    echo ""
    echo "✅ Game services starting!"
    echo ""
    echo "🎮 Game URL: http://localhost:3000"
    echo "📊 Backend API: http://localhost:3001"
    echo "🔗 Solana RPC: http://localhost:8899"
    echo ""
    echo "Waiting for services to be ready..."
    sleep 10
    
    # Open game in browser
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    else
        echo "🌐 Open http://localhost:3000 in your browser to play!"
    fi
    
    echo ""
    echo "🛑 To stop: docker-compose down"
    echo "📁 To view logs: docker-compose logs -f"
    
else
    echo "🚧 Docker not found, using npm..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed."
        echo "Install from: https://nodejs.org/"
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    # Simple frontend-only mode for quick testing
    echo "🎮 Starting in demo mode (frontend only)..."
    
    cd frontend
    
    # Create minimal env file
    if [ ! -f ".env.local" ]; then
        echo "NEXT_PUBLIC_DEMO_MODE=true" > .env.local
        echo "NEXT_PUBLIC_SOLANA_NETWORK=devnet" >> .env.local
    fi
    
    # Start frontend
    echo ""
    echo "🊀 Starting game..."
    npm run dev &
    FRONTEND_PID=$!
    
    sleep 5
    
    echo ""
    echo "✅ Game is running!"
    echo ""
    echo "🎮 Open http://localhost:3000 to play"
    echo "🕹️ Controls:"
    echo "  • WASD - Move"
    echo "  • Mouse - Aim/Shoot"
    echo "  • SPACE - Jump"
    echo "  • B - Buy Perks"
    echo "  • M - Mystery Box"
    echo "  • ESC - Pause"
    echo ""
    echo "🛑 Press Ctrl+C to stop"
    
    # Open browser
    sleep 2
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    fi
    
    # Keep running
    wait $FRONTEND_PID
fi