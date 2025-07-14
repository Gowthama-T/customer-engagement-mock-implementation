from datetime import datetime, timedelta
from sqlalchemy import func, distinct
from models import db, User, Event
import pandas as pd
import json

def calculate_analytics():
    """Calculate comprehensive analytics metrics"""
    
    # Total events count
    total_events = db.session.query(Event).count()
    
    # Daily Active Users (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    dau = db.session.query(distinct(Event.user_id)).filter(
        Event.timestamp >= thirty_days_ago
    ).count()
    
    # Top 3 actions by count
    top_actions = db.session.query(
        Event.action,
        func.count(Event.action).label('count')
    ).group_by(Event.action).order_by(
        func.count(Event.action).desc()
    ).limit(3).all()
    
    # Daily event counts for the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_events = db.session.query(
        func.date(Event.timestamp).label('date'),
        func.count(Event.id).label('count')
    ).filter(
        Event.timestamp >= seven_days_ago
    ).group_by(func.date(Event.timestamp)).all()
    
    # Total users
    total_users = db.session.query(User).count()
    
    return {
        'total_events': total_events,
        'daily_active_users': dau,
        'total_users': total_users,
        'top_actions': [{'action': action, 'count': count} for action, count in top_actions],
        'daily_events': [{'date': str(date), 'count': count} for date, count in daily_events]
    }

def process_csv_data(csv_content):
    """Process CSV data and return list of user dictionaries"""
    try:
        # Read CSV content
        df = pd.read_csv(csv_content)
        
        # Validate required columns
        required_columns = ['user_id', 'name', 'email']
        if not all(col in df.columns for col in required_columns):
            raise ValueError(f"CSV must contain columns: {required_columns}")
        
        # Clean and validate data
        df = df.dropna(subset=required_columns)
        df['user_id'] = df['user_id'].astype(str).str.strip()
        df['name'] = df['name'].astype(str).str.strip()
        df['email'] = df['email'].astype(str).str.strip()
        
        # Convert to list of dictionaries
        users_data = df.to_dict('records')
        
        return {
            'success': True,
            'users': users_data,
            'count': len(users_data)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'count': 0
        }

def validate_event_data(event_data):
    """Validate event data structure"""
    required_fields = ['user_id', 'action', 'timestamp']
    
    for field in required_fields:
        if field not in event_data:
            return False, f"Missing required field: {field}"
    
    # Validate timestamp format
    try:
        timestamp = datetime.fromisoformat(event_data['timestamp'].replace('Z', '+00:00'))
    except ValueError:
        return False, "Invalid timestamp format. Use ISO 8601 format."
    
    # Validate user_id exists
    user = User.query.filter_by(user_id=event_data['user_id']).first()
    if not user:
        return False, f"User {event_data['user_id']} not found"
    
    return True, "Valid"

def get_user_engagement_score(user_id):
    """Calculate engagement score for a user based on recent activity"""
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_events = db.session.query(Event).filter(
        Event.user_id == user_id,
        Event.timestamp >= seven_days_ago
    ).count()
    
    # Simple engagement scoring (can be enhanced)
    if recent_events == 0:
        return 'Low'
    elif recent_events <= 3:
        return 'Medium'
    else:
        return 'High'