"""
CrowdSafe AI - FastAPI Backend
Real-time crowd monitoring and safety management system
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import cv2
import numpy as np
from datetime import datetime, timedelta
import os
from typing import List, Dict, Any
import logging
from dataclasses import dataclass, asdict
import base64
from io import BytesIO
from PIL import Image

from .models import Alert, Analytics, EventLog
from .ai_detector import CrowdDetector
from .database import DatabaseManager
from .config import Settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CrowdSafe AI",
    description="Real-time crowd monitoring and safety management system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
settings = Settings()
db_manager = DatabaseManager()
crowd_detector = CrowdDetector()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except:
            self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# Global state
current_analytics = Analytics()
last_alert_time = datetime.now() - timedelta(seconds=settings.alert_cooldown_seconds)

# Video processing state
video_capture = None
processing_active = False

def initialize_video_source():
    """Initialize video capture source"""
    global video_capture
    try:
        if settings.video_source.isdigit():
            video_capture = cv2.VideoCapture(int(settings.video_source))
        else:
            video_capture = cv2.VideoCapture(settings.video_source)
        
        if not video_capture.isOpened():
            logger.error("Failed to open video source")
            return False
        
        logger.info(f"Video source initialized: {settings.video_source}")
        return True
    except Exception as e:
        logger.error(f"Error initializing video source: {e}")
        return False

async def process_video_frame():
    """Process a single video frame"""
    global current_analytics, last_alert_time
    
    if video_capture is None or not video_capture.isOpened():
        return None
    
    ret, frame = video_capture.read()
    if not ret:
        return None
    
    try:
        # Detect objects and analyze crowd
        detections = crowd_detector.detect_objects(frame)
        crowd_data = crowd_detector.analyze_crowd(frame, detections)
        
        # Update analytics
        current_analytics.crowd_density = crowd_data['density']
        current_analytics.person_count = crowd_data['person_count']
        current_analytics.safety_score = crowd_data['safety_score']
        current_analytics.last_updated = datetime.now()
        
        # Check for alerts
        alert_triggered = False
        alert_message = ""
        
        if crowd_data['density'] > settings.crowd_density_threshold:
            time_since_last_alert = datetime.now() - last_alert_time
            if time_since_last_alert.seconds >= settings.alert_cooldown_seconds:
                alert_triggered = True
                alert_message = f"High crowd density detected: {crowd_data['density']:.2%}"
                last_alert_time = datetime.now()
                
                # Create alert
                alert = Alert(
                    message=alert_message,
                    severity="high",
                    location="Main Area",
                    crowd_density=crowd_data['density']
                )
                
                # Save to database
                await db_manager.save_alert(alert)
                
                # Log event
                event_log = EventLog(
                    event_type="alert",
                    description=alert_message,
                    data={"crowd_density": crowd_data['density']}
                )
                await db_manager.save_event_log(event_log)
        
        # Draw detections on frame
        annotated_frame = crowd_detector.draw_detections(frame, detections)
        
        # Convert frame to base64 for transmission
        _, buffer = cv2.imencode('.jpg', annotated_frame)
        frame_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Prepare data for broadcast
        data = {
            "type": "video_frame",
            "frame": frame_b64,
            "analytics": asdict(current_analytics),
            "alert": {
                "triggered": alert_triggered,
                "message": alert_message
            } if alert_triggered else None
        }
        
        return data
        
    except Exception as e:
        logger.error(f"Error processing video frame: {e}")
        return None

async def video_processing_loop():
    """Main video processing loop"""
    global processing_active
    
    logger.info("Starting video processing loop")
    processing_active = True
    
    while processing_active:
        try:
            data = await process_video_frame()
            if data:
                await manager.broadcast(json.dumps(data))
            
            # Control frame rate (30 FPS)
            await asyncio.sleep(1/30)
            
        except Exception as e:
            logger.error(f"Error in video processing loop: {e}")
            await asyncio.sleep(1)

# Mount static files
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Routes
@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Serve the main dashboard"""
    try:
        with open("frontend/dashboard.html", "r") as file:
            content = file.read()
        return HTMLResponse(content=content)
    except FileNotFoundError:
        return HTMLResponse(content="<h1>Dashboard not found</h1>", status_code=404)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
            logger.info(f"Received WebSocket message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.post("/api/alerts")
async def create_alert(alert_data: dict):
    """Create a manual alert"""
    try:
        alert = Alert(
            message=alert_data.get("message", "Manual alert"),
            severity=alert_data.get("severity", "medium"),
            location=alert_data.get("location", "Unknown"),
            crowd_density=current_analytics.crowd_density
        )
        
        await db_manager.save_alert(alert)
        
        # Broadcast alert
        broadcast_data = {
            "type": "manual_alert",
            "alert": asdict(alert)
        }
        await manager.broadcast(json.dumps(broadcast_data))
        
        return {"status": "success", "alert_id": str(alert.id)}
    except Exception as e:
        logger.error(f"Error creating alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics")
async def get_analytics():
    """Get current analytics data"""
    return asdict(current_analytics)

@app.get("/api/logs")
async def get_event_logs(limit: int = 100):
    """Get recent event logs"""
    try:
        logs = await db_manager.get_event_logs(limit)
        return {"logs": logs}
    except Exception as e:
        logger.error(f"Error retrieving logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/alerts")
async def get_alerts(limit: int = 50):
    """Get recent alerts"""
    try:
        alerts = await db_manager.get_alerts(limit)
        return {"alerts": alerts}
    except Exception as e:
        logger.error(f"Error retrieving alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/start-monitoring")
async def start_monitoring():
    """Start video monitoring"""
    global processing_active
    
    if processing_active:
        return {"status": "already_running"}
    
    if not initialize_video_source():
        raise HTTPException(status_code=500, detail="Failed to initialize video source")
    
    # Start video processing in background
    asyncio.create_task(video_processing_loop())
    
    return {"status": "started"}

@app.post("/api/stop-monitoring")
async def stop_monitoring():
    """Stop video monitoring"""
    global processing_active, video_capture
    
    processing_active = False
    
    if video_capture:
        video_capture.release()
        video_capture = None
    
    return {"status": "stopped"}

@app.get("/api/status")
async def get_status():
    """Get system status"""
    return {
        "monitoring_active": processing_active,
        "connections": len(manager.active_connections),
        "last_updated": current_analytics.last_updated.isoformat() if current_analytics.last_updated else None
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("🚀 CrowdSafe AI starting up...")
    
    # Initialize database
    await db_manager.initialize()
    
    # Initialize AI detector
    crowd_detector.initialize()
    
    logger.info("✅ CrowdSafe AI initialized successfully")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global processing_active, video_capture
    
    logger.info("🛑 CrowdSafe AI shutting down...")
    
    processing_active = False
    
    if video_capture:
        video_capture.release()
        video_capture = None
    
    logger.info("✅ CrowdSafe AI shutdown complete")