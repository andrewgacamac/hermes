#!/bin/bash
# Deployment script for Hermès Monitor
# This script pulls latest changes and restarts the app

echo "🚀 Deploying Hermès Monitor..."

# Navigate to app directory
cd ~/apps/hermes || exit

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart picotin-monitor

# Show status
pm2 status

echo "✅ Deployment complete!"