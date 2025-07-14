from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import io
import csv

from config import Config
from models import db, User, Event
from utils import calculate_analytics, process_csv_data, validate_event_data

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])
    
    return app

app = create_app()

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200

@app.route('/api/event', methods=['POST'])
def track_event():
    """Track user events"""
    try:
        # Get JSON data from request
        event_data = request.get_json()
        
        if not event_data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate event data
        is_valid, message = validate_event_data(event_data)
        if not is_valid:
            return jsonify({'error': message}), 400
        
        # Parse timestamp
        timestamp = datetime.fromisoformat(event_data['timestamp'].replace('Z', '+00:00'))
        
        # Create new event
        new_event = Event(
            user_id=event_data['user_id'],
            action=event_data['action'],
            timestamp=timestamp,
            properties=json.dumps(event_data.get('properties', {}))
        )
        
        # Save to database
        db.session.add(new_event)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Event tracked successfully',
            'event_id': new_event.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to track event: {str(e)}'}), 500

@app.route('/api/upload', methods=['POST'])
def upload_users():
    """Upload user profiles via CSV"""
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be a CSV'}), 400
        
        # Read CSV content
        csv_content = io.StringIO(file.stream.read().decode('utf-8'))
        
        # Process CSV data
        result = process_csv_data(csv_content)
        
        if not result['success']:
            return jsonify({'error': result['error']}), 400
        
        # Save users to database
        users_created = 0
        users_updated = 0
        
        for user_data in result['users']:
            existing_user = User.query.filter_by(user_id=user_data['user_id']).first()
            
            if existing_user:
                # Update existing user
                existing_user.name = user_data['name']
                existing_user.email = user_data['email']
                users_updated += 1
            else:
                # Create new user
                new_user = User(
                    user_id=user_data['user_id'],
                    name=user_data['name'],
                    email=user_data['email']
                )
                db.session.add(new_user)
                users_created += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Successfully processed {result["count"]} users',
            'users_created': users_created,
            'users_updated': users_updated
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to upload users: {str(e)}'}), 500

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for dashboard"""
    try:
        analytics_data = calculate_analytics()
        
        return jsonify({
            'success': True,
            'data': analytics_data,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch analytics: {str(e)}'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users"""
    try:
        users = User.query.all()
        return jsonify({
            'success': True,
            'users': [user.to_dict() for user in users],
            'count': len(users)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get recent events with pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        events = Event.query.order_by(Event.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'events': [event.to_dict() for event in events.items],
            'pagination': {
                'page': page,
                'pages': events.pages,
                'per_page': per_page,
                'total': events.total
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch events: {str(e)}'}), 500

# Error handlers

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# Database initialization

def init_db():
    """Initialize database and create sample data"""
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Check if sample data already exists
        if User.query.count() == 0:
            # Create sample users
            sample_users = [
                {'user_id': 'u001', 'name': 'Alice Johnson', 'email': 'alice@example.com'},
                {'user_id': 'u002', 'name': 'Bob Smith', 'email': 'bob@example.com'},
                {'user_id': 'u003', 'name': 'Charlie Brown', 'email': 'charlie@example.com'},
                {'user_id': 'u004', 'name': 'Diana Wilson', 'email': 'diana@example.com'},
                {'user_id': 'u005', 'name': 'Eve Davis', 'email': 'eve@example.com'}
            ]
            
            for user_data in sample_users:
                user = User(**user_data)
                db.session.add(user)
            
            # Create sample events
            sample_events = [
                {'user_id': 'u001', 'action': 'Login', 'timestamp': datetime.utcnow()},
                {'user_id': 'u001', 'action': 'AddToCart', 'timestamp': datetime.utcnow()},
                {'user_id': 'u002', 'action': 'Login', 'timestamp': datetime.utcnow()},
                {'user_id': 'u003', 'action': 'AddToCart', 'timestamp': datetime.utcnow()},
                {'user_id': 'u002', 'action': 'Checkout', 'timestamp': datetime.utcnow()},
                {'user_id': 'u004', 'action': 'Login', 'timestamp': datetime.utcnow()},
                {'user_id': 'u005', 'action': 'AddToCart', 'timestamp': datetime.utcnow()},
                {'user_id': 'u003', 'action': 'Checkout', 'timestamp': datetime.utcnow()},
                {'user_id': 'u001', 'action': 'Checkout', 'timestamp': datetime.utcnow()},
                {'user_id': 'u004', 'action': 'AddToCart', 'timestamp': datetime.utcnow()}
            ]
            
            for event_data in sample_events:
                event = Event(**event_data)
                db.session.add(event)
            
            db.session.commit()
            print("Sample data created successfully!")

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    
    # Run the application
    print("🚀 Starting Mock Customer Engagement Platform API...")
    print("📊 Dashboard available at: http://localhost:8000")
    print("🔌 API endpoints at: http://localhost:5000/api/")
    
    app.run(debug=True, host='0.0.0.0', port=5000)