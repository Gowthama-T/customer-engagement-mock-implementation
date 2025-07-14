# System Architecture

## Overview

The Mock Customer Engagement Platform is designed to simulate a real-world customer engagement solution like MoEngage. It demonstrates key concepts of event tracking, data ingestion, analytics, and dashboard visualization.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│    Frontend     │◄──►│    Backend      │◄──►│    Database     │
│   (HTML/JS)     │    │   (Flask API)   │    │   (SQLite)      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                        ▲
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │
│   Mock SDK      │    │   Analytics     │
│  (JavaScript)   │    │    Engine       │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
```

## Component Details

### 1. Frontend Layer

**Technologies:** HTML5, CSS3, JavaScript, Chart.js

**Components:**
- **Home Page (`index.html`)**: User interaction simulation
- **Dashboard (`dashboard.html`)**: Analytics visualization
- **Mock SDK (`sdk.js`)**: Simulates real SDK integration
- **Main App (`main.js`)**: Core application logic
- **Dashboard (`dashboard.js`)**: Chart rendering and data visualization

**Responsibilities:**
- User interface for event simulation
- Real-time event tracking
- CSV file upload handling
- Analytics dashboard with interactive charts
- Data export functionality

### 2. Backend Layer

**Technologies:** Python Flask, SQLAlchemy

**Components:**
- **Flask Application (`app.py`)**: Main API server
- **Database Models (`models.py`)**: User and Event data models
- **Configuration (`config.py`)**: Environment-based settings
- **Utilities (`utils.py`)**: Analytics calculations and data processing

**API Endpoints:**
- `POST /api/event`: Event tracking
- `POST /api/upload`: CSV user data upload
- `GET /api/analytics`: Analytics data retrieval
- `GET /api/users`: User management
- `GET /api/events`: Event history with pagination
- `GET /api/health`: Health check

### 3. Database Layer

**Technology:** SQLite (file-based for simplicity)

**Schema:**
```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    timestamp DATETIME NOT NULL,
    properties TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### 4. Mock SDK

**Purpose:** Simulates real SDK integration patterns

**Features:**
- Event queuing for offline scenarios
- Retry logic with exponential backoff
- Batch event processing
- Network status monitoring
- Debug logging and error handling

## Data Flow

### 1. Event Tracking Flow
```
User Action → Frontend Button → Mock SDK → HTTP POST → Flask API → Database
                                    ↓
                               Event Queue (if offline)
```

### 2. CSV Upload Flow
```
CSV File → File Upload → FormData → Flask API → Pandas Processing → Database
```

### 3. Analytics Flow
```
Database → SQL Aggregation → Analytics Engine → JSON Response → Dashboard Charts
```

## Key Design Patterns

### 1. **Application Factory Pattern**
The Flask app uses the application factory pattern for better testability and configuration management.

### 2. **Repository Pattern**
SQLAlchemy models encapsulate data access logic with clean abstractions.

### 3. **Event-Driven Architecture**
The frontend uses event listeners for user interactions and SDK integration.

### 4. **MVC Architecture**
- **Model**: Database models and business logic
- **View**: HTML templates and frontend components
- **Controller**: Flask route handlers and API endpoints

## Security Considerations

### Current Implementation
- CORS enabled for local development
- Basic input validation
- SQL injection protection via SQLAlchemy ORM

### Production Recommendations
- JWT authentication
- Rate limiting
- Input sanitization
- HTTPS enforcement
- Environment-based secrets management

## Scalability Considerations

### Current Limitations
- SQLite for single-server deployment
- Synchronous request processing
- No caching layer

### Scaling Strategies
- **Database**: Migrate to PostgreSQL/MySQL
- **Caching**: Add Redis for session management
- **Queue**: Implement Celery for background processing
- **Load Balancing**: Use Nginx for multiple Flask instances

## Deployment Architecture

### Development
```
Local Development:
├── Frontend: Python HTTP Server (port 8000)
├── Backend: Flask Dev Server (port 5000)
└── Database: SQLite file
```

### Production
```
Cloud Deployment:
├── Frontend: Netlify/Vercel (CDN)
├── Backend: Heroku/Render (container)
├── Database: Managed PostgreSQL
└── Storage: AWS S3 (file uploads)
```

## Performance Metrics

### Target Performance
- **API Response Time**: < 200ms (95th percentile)
- **Dashboard Load Time**: < 3 seconds
- **Event Processing**: 1000+ events/second
- **Concurrent Users**: 100+ simultaneous users

### Monitoring Points
- API endpoint latency
- Database query performance
- Frontend bundle size
- Real-user monitoring (RUM)

## Technology Choices Rationale

### Backend: Flask
- **Pros**: Lightweight, flexible, great for prototypes
- **Cons**: Not as feature-rich as Django
- **Alternative**: FastAPI for better async support

### Frontend: Vanilla JavaScript
- **Pros**: No build step, easy to understand
- **Cons**: More manual DOM manipulation
- **Alternative**: React/Vue for complex applications

### Database: SQLite
- **Pros**: Zero configuration, file-based
- **Cons**: Limited concurrency, no clustering
- **Alternative**: PostgreSQL for production

### Charts: Chart.js
- **Pros**: Lightweight, extensive chart types
- **Cons**: Less customizable than D3.js
- **Alternative**: D3.js for complex visualizations

## Future Enhancements

### Phase 1: Core Features
- [ ] JWT authentication
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics (cohort analysis)
- [ ] A/B testing framework

### Phase 2: Enterprise Features
- [ ] Multi-tenant architecture
- [ ] Campaign management
- [ ] Workflow automation
- [ ] Machine learning insights

### Phase 3: Scale & Performance
- [ ] Microservices architecture
- [ ] Event streaming (Kafka)
- [ ] Distributed caching
- [ ] Container orchestration (Kubernetes)