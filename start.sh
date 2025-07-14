#!/bin/bash

# Mock Customer Engagement Platform - Quick Start Script

echo "🚀 Starting Mock Customer Engagement Platform..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8+ and try again."
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null && ! command -v pip3 &> /dev/null; then
    echo "❌ pip is required but not installed."
    echo "Please install pip and try again."
    exit 1
fi

# Function to install backend dependencies
install_backend_deps() {
    echo "📦 Installing backend dependencies..."
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "🔧 Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate || {
        echo "❌ Failed to activate virtual environment"
        exit 1
    }
    
    # Install dependencies
    pip install -r requirements.txt || {
        echo "❌ Failed to install dependencies"
        exit 1
    }
    
    cd ..
}

# Function to start backend
start_backend() {
    echo "🔧 Starting backend server..."
    cd backend
    source venv/bin/activate
    python app.py &
    BACKEND_PID=$!
    echo "✅ Backend server started (PID: $BACKEND_PID)"
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🔧 Starting frontend server..."
    cd frontend
    python3 -m http.server 8000 &
    FRONTEND_PID=$!
    echo "✅ Frontend server started (PID: $FRONTEND_PID)"
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend server stopped"
    fi
    echo "👋 Thanks for using Mock Customer Engagement Platform!"
}

# Trap signals to cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

# Main execution
echo "🔧 Setting up the project..."

# Install backend dependencies
install_backend_deps

# Start backend server
start_backend

# Wait a moment for backend to start
sleep 3

# Start frontend server
start_frontend

# Wait for both servers to be ready
sleep 2

echo ""
echo "🎉 Mock Customer Engagement Platform is running!"
echo ""
echo "📊 Frontend (Home): http://localhost:8000"
echo "📈 Frontend (Dashboard): http://localhost:8000/dashboard.html"
echo "🔌 Backend API: http://localhost:5000/api"
echo "🏥 API Health Check: http://localhost:5000/api/health"
echo ""
echo "📝 API Documentation: docs/api-documentation.md"
echo "🎯 Postman Collection: docs/postman-collection.json"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Keep script running and wait for user to stop
wait