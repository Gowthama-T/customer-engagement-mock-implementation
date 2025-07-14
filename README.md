# 🚀 Mock Customer Engagement Platform

A portfolio project simulating key workflows of a Customer Engagement Platform (similar to MoEngage) demonstrating Implementation Analyst skills including SDK integration, API ingestion, user event tracking, and analytics dashboards.

## 🌟 Features

### Frontend
- **Home Page**: Interactive buttons for user actions (Login, Add to Cart, Checkout)
- **Analytics Dashboard**: Real-time visualization of user engagement metrics
- **Responsive Design**: Modern UI with clean, professional styling

### Backend
- **REST API**: Flask-based API for event tracking and data ingestion
- **Event Processing**: Real-time user event collection and storage
- **CSV Upload**: Bulk user profile import functionality
- **Analytics Engine**: Aggregated metrics and reporting

### Analytics & Insights
- **Total Events**: Track all user interactions
- **Daily Active Users (DAU)**: Monitor user engagement trends
- **Top Actions**: Identify most popular user behaviors
- **Interactive Charts**: Powered by Chart.js

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Chart.js
- **Backend**: Python Flask, SQLAlchemy
- **Database**: SQLite (file-based for easy deployment)
- **API Testing**: Postman collection included
- **Deployment**: Ready for cloud deployment (Netlify/Vercel + Render/Heroku)

## 📁 Project Structure

```
mock-engagement-platform/
├── backend/
│   ├── app.py                 # Flask application
│   ├── models.py              # Database models
│   ├── config.py              # Configuration settings
│   ├── utils.py               # Utility functions
│   ├── requirements.txt       # Python dependencies
│   └── sample_data/
│       ├── users.csv          # Sample user profiles
│       └── events.json        # Sample events
├── frontend/
│   ├── index.html             # Home page
│   ├── dashboard.html         # Analytics dashboard
│   ├── css/
│   │   └── style.css          # Styling
│   └── js/
│       ├── main.js            # Main application logic
│       ├── dashboard.js       # Dashboard functionality
│       └── sdk.js             # Mock SDK implementation
├── docs/
│   ├── api-documentation.md   # API endpoints guide
│   ├── architecture.md        # System architecture
│   └── postman-collection.json
├── Dockerfile                 # Container configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
The API will be available at `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
# Serve using Python's built-in server
python -m http.server 8000
```
The frontend will be available at `http://localhost:8000`

### Database Initialization
The SQLite database will be automatically created when you first run the backend.

## 📊 API Endpoints

### Event Tracking
- `POST /api/event` - Track user events
- `GET /api/analytics` - Get analytics data
- `POST /api/upload` - Upload user profiles (CSV)

### Sample Event Payload
```json
{
  "user_id": "u123",
  "action": "AddToCart",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🎯 Key Implementation Highlights

### SDK Integration Simulation
- JavaScript snippet that automatically tracks user interactions
- Real-time event posting to backend API
- Error handling and retry mechanisms

### Data Ingestion Pipeline
- CSV parsing for bulk user profile uploads
- Data validation and sanitization
- Batch processing capabilities

### Analytics Engine
- Real-time metrics calculation
- Time-series data aggregation
- Performance-optimized queries

## 🧪 Testing

### Sample Data
The project includes:
- 5 dummy user profiles
- 10 sample events across different actions
- Realistic timestamps and user behaviors

### API Testing
Import the Postman collection from `docs/postman-collection.json` to test all endpoints.

## 🌐 Deployment

### Frontend (Netlify/Vercel)
```bash
# Build and deploy frontend
cd frontend
# Upload to your preferred hosting service
```

### Backend (Render/Heroku)
```bash
# Deploy Flask API
cd backend
# Follow your cloud provider's deployment guide
```

### Docker Deployment
```bash
# Build and run with Docker
docker build -t engagement-platform .
docker run -p 5000:5000 engagement-platform
```

## 🏆 Portfolio Highlights

This project demonstrates:
- **Full-Stack Development**: End-to-end implementation
- **API Design**: RESTful services with proper status codes
- **Data Visualization**: Interactive charts and metrics
- **Real-time Processing**: Event streaming and analytics
- **Data Engineering**: CSV ingestion and processing
- **Modern UI/UX**: Responsive, professional design
- **DevOps**: Containerization and deployment-ready code

## 🔧 Configuration

Environment variables (create `.env` file):
```
FLASK_ENV=development
DATABASE_URL=sqlite:///engagement.db
SECRET_KEY=your-secret-key
```

## 📈 Future Enhancements

- JWT-based authentication
- Workflow automation (re-engagement notifications)
- Real-time WebSocket connections
- Advanced segmentation and targeting
- A/B testing framework

## 🤝 Contributing

This is a portfolio project, but feedback and suggestions are welcome!

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ as a portfolio demonstration of Implementation Analyst skills.