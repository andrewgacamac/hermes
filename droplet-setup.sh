#!/bin/bash
# DigitalOcean Droplet Setup Script for Hermès Monitor

echo "🚀 Starting Hermès Monitor Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install build essentials
sudo apt install -y build-essential

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Create app directory
echo "📁 Creating app directory..."
mkdir -p ~/apps
cd ~/apps

# Clone repository
echo "🔄 Cloning repository..."
git clone https://github.com/andrewgacamac/hermes.git
cd hermes

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Create logs directory
mkdir -p logs

echo "✅ Basic setup complete!"
echo ""
echo "⚠️  IMPORTANT: Next steps:"
echo "1. Create .env file: nano ~/apps/hermes/.env"
echo "2. Add your Twilio credentials to .env"
echo "3. Start the app: pm2 start ecosystem.config.js"
echo "4. Save PM2 config: pm2 save"
echo "5. Enable PM2 startup: pm2 startup"