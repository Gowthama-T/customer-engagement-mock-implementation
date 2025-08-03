"""
CrowdSafe AI - Data Models
Pydantic models for the application
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class EventType(str, Enum):
    ALERT = "alert"
    DETECTION = "detection"
    SYSTEM = "system"
    USER_ACTION = "user_action"

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    message: str
    severity: AlertSeverity
    location: str
    crowd_density: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.now)
    resolved: bool = False
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Analytics(BaseModel):
    crowd_density: float = 0.0
    person_count: int = 0
    safety_score: float = 100.0
    active_alerts: int = 0
    last_updated: Optional[datetime] = None
    zones: Dict[str, Dict[str, Any]] = Field(default_factory=dict)

class EventLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    event_type: EventType
    description: str
    data: Dict[str, Any] = Field(default_factory=dict)
    location: Optional[str] = None
    user_id: Optional[str] = None

class Detection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    object_type: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]
    location: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class Zone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    coordinates: List[List[float]]  # Polygon coordinates
    max_capacity: int
    current_occupancy: int = 0
    alert_threshold: float = 0.8
    active: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)

class CameraSource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    source: str  # URL, device index, or file path
    location: str
    active: bool = True
    resolution: Optional[str] = None
    fps: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)