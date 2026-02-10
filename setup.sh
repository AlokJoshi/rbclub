#!/bin/bash

# Quick Setup Script for DigitalOcean Droplet
# This script installs all necessary dependencies for rbclub

set -e  # Exit on error

echo "🚀 RBClub Quick Setup for DigitalOcean Droplet"
echo "=============================================="
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "⚠️  This script is designed for Linux systems (Ubuntu/Debian)"
    echo "Please install dependencies manually on other systems."
    exit 1
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Please don't run this script as root"
    echo "Run it as a regular user with sudo privileges"
    exit 1
fi

echo "Step 1: Updating system packages..."
sudo apt-get update

echo ""
echo "Step 2: Installing build tools..."
sudo apt-get install -y build-essential python3 git

echo ""
echo "Step 3: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo "✓ Node.js is already installed: $NODE_VERSION"
fi

echo ""
echo "Step 4: Installing npm dependencies..."
npm install

echo ""
echo "Step 5: Rebuilding native modules..."
npm rebuild bcrypt better-sqlite3

echo ""
echo "Step 6: Checking environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "⚠️  Creating .env from .env.example..."
        cp .env.example .env
        echo "📝 Please edit .env file with your configuration:"
        echo "   - SESSION_SECRET"
        echo "   - ADMIN_IDS"
        echo "   - EMAIL settings"
        echo "   - SPACES credentials"
    else
        echo "⚠️  Warning: .env.example not found"
    fi
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Step 7: Checking PM2 installation (optional but recommended)..."
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. To install PM2 for production use:"
    echo "  sudo npm install -g pm2"
else
    echo "✓ PM2 is already installed"
fi

echo ""
echo "=============================================="
echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration:"
echo "   nano .env"
echo ""
echo "2. Start the application:"
echo "   npm start"
echo "   OR with PM2 (recommended for production):"
echo "   pm2 start server.js --name rbclub"
echo ""
echo "3. Access your application at http://your-server-ip:3000"
echo ""
echo "For more details, see DEPLOYMENT.md"
echo "=============================================="
