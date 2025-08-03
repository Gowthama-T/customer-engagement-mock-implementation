#!/bin/bash

# CrowdSafe AI - Start Script
# Launches the CrowdSafe AI application with proper setup

set -e  # Exit on any error

echo "🚀 Starting CrowdSafe AI Application"
echo "=================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "🐍 Python version: $PYTHON_VERSION"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads logs

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📄 Creating .env file from template..."
        cp .env.example .env
        echo "⚠️ Please review and update the .env file with your configuration."
    else
        echo "⚠️ No .env file found. Creating default configuration..."
        cat > .env << EOF
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=crowdsafe_ai
VIDEO_SOURCE=0
CROWD_DENSITY_THRESHOLD=0.8
ALERT_COOLDOWN_SECONDS=30
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
EOF
    fi
fi

# Check if MongoDB is running (optional)
if command -v mongosh &> /dev/null; then
    echo "🍃 Checking MongoDB connection..."
    if mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️ MongoDB connection failed. Please ensure MongoDB is running."
        echo "   You can install MongoDB from: https://www.mongodb.com/docs/manual/installation/"
    fi
else
    echo "⚠️ MongoDB CLI not found. Please ensure MongoDB is installed and running."
fi

# Check for camera access (Linux/macOS)
if [ -e "/dev/video0" ]; then
    echo "📹 Camera device found: /dev/video0"
else
    echo "⚠️ No camera device found at /dev/video0"
    echo "   You can use a video file by setting VIDEO_SOURCE in .env"
fi

echo ""
echo "🎉 Setup complete! Starting CrowdSafe AI..."
echo ""
echo "📊 Dashboard will be available at: http://localhost:8000"
echo "🔗 API documentation at: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start the application
python main.py