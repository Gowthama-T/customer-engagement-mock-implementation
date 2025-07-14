# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently, no authentication is required. For production use, implement JWT or API key authentication.

## Endpoints

### Health Check

#### `GET /health`
Check the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

---

### Event Tracking

#### `POST /event`
Track a user event.

**Request Body:**
```json
{
  "user_id": "u123",
  "action": "AddToCart",
  "timestamp": "2024-01-15T10:30:00Z",
  "properties": {
    "product_id": "p456",
    "category": "electronics"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Event tracked successfully",
  "event_id": 123
}
```

**Response (Error):**
```json
{
  "error": "User u123 not found"
}
```

**Status Codes:**
- `201`: Event created successfully
- `400`: Invalid request data
- `500`: Server error

---

### User Management

#### `POST /upload`
Upload user profiles via CSV file.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: CSV file with columns: `user_id`, `name`, `email`

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 5 users",
  "users_created": 3,
  "users_updated": 2
}
```

#### `GET /users`
Get all users.

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "user_id": "u123",
      "name": "John Doe",
      "email": "john@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### Analytics

#### `GET /analytics`
Get aggregated analytics data.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_events": 150,
    "daily_active_users": 25,
    "total_users": 50,
    "top_actions": [
      {
        "action": "Login",
        "count": 45
      },
      {
        "action": "AddToCart",
        "count": 32
      },
      {
        "action": "Checkout",
        "count": 18
      }
    ],
    "daily_events": [
      {
        "date": "2024-01-15",
        "count": 23
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Events

#### `GET /events`
Get recent events with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Events per page (default: 20)

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": 1,
      "user_id": "u123",
      "action": "Login",
      "timestamp": "2024-01-15T10:30:00Z",
      "properties": {},
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "per_page": 20,
    "total": 100
  }
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Description of the error"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Implement rate limiting per IP/user
- Consider using Redis for distributed rate limiting

---

## Data Models

### User
```python
{
  "id": int,
  "user_id": str,
  "name": str,
  "email": str,
  "created_at": datetime
}
```

### Event
```python
{
  "id": int,
  "user_id": str,
  "action": str,
  "timestamp": datetime,
  "properties": json,
  "created_at": datetime
}
```

---

## Sample CSV Format

For user upload, use this format:

```csv
user_id,name,email
u001,Alice Johnson,alice@example.com
u002,Bob Smith,bob@example.com
```

Required columns:
- `user_id`: Unique user identifier
- `name`: User's full name
- `email`: User's email address