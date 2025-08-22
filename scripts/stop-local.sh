#!/bin/bash

# Stop all services

if [ -f ".pids" ]; then
    echo "Stopping services..."
    
    # Read PIDs
    source .pids
    
    # Kill processes
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null && echo "Stopped frontend"
    [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null && echo "Stopped backend"
    [ ! -z "$REDIS_PID" ] && kill $REDIS_PID 2>/dev/null && echo "Stopped Redis"
    [ ! -z "$MONGO_PID" ] && kill $MONGO_PID 2>/dev/null && echo "Stopped MongoDB"
    [ ! -z "$SOLANA_PID" ] && kill $SOLANA_PID 2>/dev/null && echo "Stopped Solana"
    
    # Clean up
    rm .pids
    echo "All services stopped."
else
    echo "No services running (no .pids file found)"
fi