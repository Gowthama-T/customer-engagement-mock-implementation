# CrowdSafe AI

CrowdSafe AI is a real-time web application designed to monitor and manage public safety during large-scale events such as music festivals, sports events, or political rallies. It leverages AI-powered anomaly detection and real-time video processing to detect unsafe situations like overcrowding, violence, fire, stampedes, or unattended objects.

## Features

- **Real-Time Video Processing**: Live video feed analysis from cameras or files
- **AI-Powered Detection**: YOLOv8 model for object/person detection and crowd analysis
- **Real-Time Dashboard**: Interactive dashboard displaying crowd density and safety metrics
- **Alert System**: Automatic alerts when safety thresholds are exceeded
- **Map Integration**: Visual representation of event zones and flagged areas
- **Communication Tools**: Alert logging and communication panel for security staff
- **Event Logging**: Comprehensive logging of all events and alerts for audits

## Tech Stack

- **Backend**: Python (FastAPI)
- **Frontend**: HTML, CSS, JavaScript
- **Real-Time Communication**: WebSockets
- **Computer Vision & AI**: OpenCV, YOLOv8 (Ultralytics)
- **Database**: MongoDB for logs and alerts
- **DevOps**: Docker, GitHub Actions

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crowdsafe-ai
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up MongoDB (local or cloud):
```bash
# For local MongoDB installation:
# Follow MongoDB installation guide for your OS
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run the application:
```bash
python main.py
```

6. Access the dashboard at `http://localhost:8000`

## Docker Setup

```bash
docker-compose up --build
```

## Configuration

Create a `.env` file with the following variables:

```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=crowdsafe_ai
VIDEO_SOURCE=0  # 0 for webcam, or path to video file
CROWD_DENSITY_THRESHOLD=0.8
ALERT_COOLDOWN_SECONDS=30
```

## Usage

1. Start the application
2. Access the web dashboard
3. Configure camera sources and detection zones
4. Monitor real-time crowd analytics
5. Respond to alerts and manage safety incidents

## API Endpoints

- `GET /`: Main dashboard
- `WebSocket /ws`: Real-time updates
- `POST /api/alerts`: Create manual alert
- `GET /api/analytics`: Get crowd analytics
- `GET /api/logs`: Retrieve event logs

## License

MIT License