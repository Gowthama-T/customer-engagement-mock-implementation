"""
CrowdSafe AI - Database Manager
MongoDB integration for storing alerts, logs, and analytics
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from .models import Alert, EventLog, Analytics
from .config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        
    async def initialize(self):
        """Initialize database connection"""
        try:
            logger.info("Connecting to MongoDB...")
            self.client = AsyncIOMotorClient(settings.mongodb_url)
            self.db = self.client[settings.database_name]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info("✅ MongoDB connected successfully")
            
            # Create indexes
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            # Continue without database for development
            logger.warning("⚠️ Continuing without database...")
    
    async def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Alerts collection indexes
            await self.db.alerts.create_index("timestamp")
            await self.db.alerts.create_index("severity")
            await self.db.alerts.create_index("resolved")
            
            # Event logs collection indexes
            await self.db.event_logs.create_index("timestamp")
            await self.db.event_logs.create_index("event_type")
            
            logger.info("✅ Database indexes created")
            
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    async def save_alert(self, alert: Alert) -> bool:
        """Save an alert to the database"""
        try:
            if self.db is None:
                logger.warning("Database not available, skipping alert save")
                return False
                
            alert_dict = alert.dict()
            alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
            if alert_dict.get('resolved_at'):
                alert_dict['resolved_at'] = alert_dict['resolved_at'].isoformat()
            
            result = await self.db.alerts.insert_one(alert_dict)
            logger.info(f"Alert saved with ID: {result.inserted_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving alert: {e}")
            return False
    
    async def save_event_log(self, event_log: EventLog) -> bool:
        """Save an event log to the database"""
        try:
            if self.db is None:
                logger.warning("Database not available, skipping event log save")
                return False
                
            log_dict = event_log.dict()
            log_dict['timestamp'] = log_dict['timestamp'].isoformat()
            
            result = await self.db.event_logs.insert_one(log_dict)
            logger.info(f"Event log saved with ID: {result.inserted_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving event log: {e}")
            return False
    
    async def get_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent alerts from the database"""
        try:
            if self.db is None:
                return []
                
            cursor = self.db.alerts.find().sort("timestamp", -1).limit(limit)
            alerts = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string and format timestamps
            for alert in alerts:
                alert['_id'] = str(alert['_id'])
                
            return alerts
            
        except Exception as e:
            logger.error(f"Error retrieving alerts: {e}")
            return []
    
    async def get_event_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent event logs from the database"""
        try:
            if self.db is None:
                return []
                
            cursor = self.db.event_logs.find().sort("timestamp", -1).limit(limit)
            logs = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for log in logs:
                log['_id'] = str(log['_id'])
                
            return logs
            
        except Exception as e:
            logger.error(f"Error retrieving event logs: {e}")
            return []
    
    async def resolve_alert(self, alert_id: str, resolved_by: str) -> bool:
        """Mark an alert as resolved"""
        try:
            if self.db is None:
                return False
                
            result = await self.db.alerts.update_one(
                {"id": alert_id},
                {
                    "$set": {
                        "resolved": True,
                        "resolved_by": resolved_by,
                        "resolved_at": datetime.now().isoformat()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error resolving alert: {e}")
            return False
    
    async def get_analytics_history(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get analytics data for the specified time period"""
        try:
            if self.db is None:
                return []
                
            since = datetime.now() - timedelta(hours=hours)
            
            cursor = self.db.analytics.find(
                {"timestamp": {"$gte": since.isoformat()}}
            ).sort("timestamp", 1)
            
            analytics = await cursor.to_list(length=None)
            
            # Convert ObjectId to string
            for item in analytics:
                item['_id'] = str(item['_id'])
                
            return analytics
            
        except Exception as e:
            logger.error(f"Error retrieving analytics history: {e}")
            return []
    
    async def save_analytics(self, analytics: Analytics) -> bool:
        """Save analytics data to the database"""
        try:
            if self.db is None:
                return False
                
            analytics_dict = analytics.dict()
            if analytics_dict.get('last_updated'):
                analytics_dict['last_updated'] = analytics_dict['last_updated'].isoformat()
            analytics_dict['timestamp'] = datetime.now().isoformat()
            
            result = await self.db.analytics.insert_one(analytics_dict)
            return True
            
        except Exception as e:
            logger.error(f"Error saving analytics: {e}")
            return False
    
    async def cleanup_old_data(self, days: int = 30):
        """Clean up old data from the database"""
        try:
            if self.db is None:
                return
                
            cutoff_date = datetime.now() - timedelta(days=days)
            cutoff_iso = cutoff_date.isoformat()
            
            # Clean up old event logs
            result1 = await self.db.event_logs.delete_many(
                {"timestamp": {"$lt": cutoff_iso}}
            )
            
            # Clean up old analytics data
            result2 = await self.db.analytics.delete_many(
                {"timestamp": {"$lt": cutoff_iso}}
            )
            
            logger.info(f"Cleanup completed: {result1.deleted_count} logs, {result2.deleted_count} analytics records deleted")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
    
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Database connection closed")