"""
CrowdSafe AI - Configuration Settings
Centralized configuration management
"""

import os
from typing import List
from pydantic import BaseSettings

class Settings(BaseSettings):
    # MongoDB Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "crowdsafe_ai"
    
    # Video Source Configuration
    video_source: str = "0"  # Default to webcam
    
    # AI Model Configuration
    yolo_model_path: str = "yolov8n.pt"  # Will download automatically
    confidence_threshold: float = 0.5
    iou_threshold: float = 0.45
    
    # Alert Configuration
    crowd_density_threshold: float = 0.8
    alert_cooldown_seconds: int = 30
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"
    
    # CORS Configuration
    cors_origins: List[str] = ["*"]
    
    # Security Configuration
    secret_key: str = "your-secret-key-here"  # Change in production
    
    # Performance Configuration
    max_connections: int = 100
    frame_rate: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global settings instance
settings = Settings()