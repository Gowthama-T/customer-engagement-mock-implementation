#!/usr/bin/env python3
"""
CrowdSafe AI - Main Application Entry Point
Real-time crowd monitoring and safety management system
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    log_level = os.getenv("LOG_LEVEL", "info").lower()
    
    print("🚀 Starting CrowdSafe AI Application...")
    print(f"📡 Server will be available at: http://{host}:{port}")
    print("🔗 Dashboard: http://localhost:8000")
    print("📊 Real-time monitoring active")
    
    uvicorn.run(
        "backend.app:app",
        host=host,
        port=port,
        log_level=log_level,
        reload=True
    )