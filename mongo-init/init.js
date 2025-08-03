// MongoDB initialization script for CrowdSafe AI
// This script sets up the initial database structure and indexes

// Switch to the CrowdSafe AI database
db = db.getSiblingDB('crowdsafe_ai');

// Create collections with validation schemas
db.createCollection('alerts', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "message", "severity", "location", "timestamp"],
      properties: {
        id: { bsonType: "string" },
        message: { bsonType: "string" },
        severity: { 
          bsonType: "string",
          enum: ["low", "medium", "high", "critical"]
        },
        location: { bsonType: "string" },
        crowd_density: { bsonType: "number" },
        timestamp: { bsonType: "date" },
        resolved: { bsonType: "bool" },
        resolved_by: { bsonType: "string" },
        resolved_at: { bsonType: "date" },
        metadata: { bsonType: "object" }
      }
    }
  }
});

db.createCollection('event_logs', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "timestamp", "event_type", "description"],
      properties: {
        id: { bsonType: "string" },
        timestamp: { bsonType: "date" },
        event_type: { 
          bsonType: "string",
          enum: ["alert", "detection", "system", "user_action"]
        },
        description: { bsonType: "string" },
        data: { bsonType: "object" },
        location: { bsonType: "string" },
        user_id: { bsonType: "string" }
      }
    }
  }
});

db.createCollection('analytics', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp"],
      properties: {
        timestamp: { bsonType: "date" },
        crowd_density: { bsonType: "number" },
        person_count: { bsonType: "number" },
        safety_score: { bsonType: "number" },
        active_alerts: { bsonType: "number" },
        zones: { bsonType: "object" }
      }
    }
  }
});

// Create indexes for better performance
db.alerts.createIndex({ "timestamp": -1 });
db.alerts.createIndex({ "severity": 1 });
db.alerts.createIndex({ "resolved": 1 });
db.alerts.createIndex({ "location": 1 });

db.event_logs.createIndex({ "timestamp": -1 });
db.event_logs.createIndex({ "event_type": 1 });
db.event_logs.createIndex({ "location": 1 });

db.analytics.createIndex({ "timestamp": -1 });

// Insert sample data for demonstration
db.alerts.insertMany([
  {
    id: "sample-alert-1",
    message: "Welcome to CrowdSafe AI - System initialized",
    severity: "low",
    location: "System",
    crowd_density: 0.0,
    timestamp: new Date(),
    resolved: false,
    metadata: { source: "system" }
  }
]);

db.event_logs.insertMany([
  {
    id: "sample-log-1",
    timestamp: new Date(),
    event_type: "system",
    description: "CrowdSafe AI system initialized",
    data: { version: "1.0.0" },
    location: "System"
  }
]);

print("✅ CrowdSafe AI database initialized successfully!");
print("📊 Collections created: alerts, event_logs, analytics");
print("🔍 Indexes created for optimal performance");
print("📝 Sample data inserted for demonstration");