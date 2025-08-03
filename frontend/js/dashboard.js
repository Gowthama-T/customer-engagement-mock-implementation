/**
 * CrowdSafe AI Dashboard - Real-time monitoring interface
 * Handles WebSocket communication, video feed, charts, and alerts
 */

class CrowdSafeDashboard {
    constructor() {
        this.ws = null;
        this.isMonitoring = false;
        this.charts = {};
        this.map = null;
        this.alerts = [];
        this.eventLogs = [];
        
        // Data arrays for charts
        this.densityData = [];
        this.peopleData = [];
        this.timeLabels = [];
        
        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupEventHandlers();
        this.initializeCharts();
        this.initializeMap();
        this.loadInitialData();
        
        console.log('🚀 CrowdSafe AI Dashboard initialized');
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.updateConnectionStatus(true);
            };
            
            this.ws.onmessage = (event) => {
                this.handleWebSocketMessage(event);
            };
            
            this.ws.onclose = () => {
                console.log('❌ WebSocket disconnected');
                this.updateConnectionStatus(false);
                
                // Attempt to reconnect after 3 seconds
                setTimeout(() => {
                    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                        this.setupWebSocket();
                    }
                }, 3000);
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showNotification('WebSocket connection error', 'error');
            };
            
        } catch (error) {
            console.error('Failed to setup WebSocket:', error);
            this.showNotification('Failed to connect to server', 'error');
        }
    }

    handleWebSocketMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'video_frame':
                    this.updateVideoFeed(data.frame);
                    this.updateAnalytics(data.analytics);
                    if (data.alert) {
                        this.handleAlert(data.alert);
                    }
                    break;
                    
                case 'manual_alert':
                    this.handleAlert(data.alert);
                    break;
                    
                case 'system_status':
                    this.updateSystemStatus(data);
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    setupEventHandlers() {
        // Start/Stop monitoring buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startMonitoring();
        });
        
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stopMonitoring();
        });
    }

    async startMonitoring() {
        try {
            const response = await fetch('/api/start-monitoring', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.status === 'started' || result.status === 'already_running') {
                this.isMonitoring = true;
                this.updateMonitoringUI(true);
                this.showNotification('Monitoring started successfully', 'success');
            } else {
                this.showNotification('Failed to start monitoring', 'error');
            }
        } catch (error) {
            console.error('Error starting monitoring:', error);
            this.showNotification('Error starting monitoring', 'error');
        }
    }

    async stopMonitoring() {
        try {
            const response = await fetch('/api/stop-monitoring', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const result = await response.json();
            
            if (result.status === 'stopped') {
                this.isMonitoring = false;
                this.updateMonitoringUI(false);
                this.showNotification('Monitoring stopped', 'warning');
                
                // Hide video feed
                document.getElementById('videoFeed').style.display = 'none';
                document.getElementById('videoPlaceholder').style.display = 'flex';
            }
        } catch (error) {
            console.error('Error stopping monitoring:', error);
            this.showNotification('Error stopping monitoring', 'error');
        }
    }

    updateMonitoringUI(isActive) {
        const statusIndicator = document.getElementById('statusIndicator');
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (isActive) {
            statusIndicator.className = 'status-indicator active';
            statusIndicator.innerHTML = '<i class="fas fa-circle"></i><span>Monitoring Active</span>';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-flex';
        } else {
            statusIndicator.className = 'status-indicator inactive';
            statusIndicator.innerHTML = '<i class="fas fa-circle"></i><span>Monitoring Inactive</span>';
            startBtn.style.display = 'inline-flex';
            stopBtn.style.display = 'none';
        }
    }

    updateVideoFeed(frameData) {
        const videoFeed = document.getElementById('videoFeed');
        const videoPlaceholder = document.getElementById('videoPlaceholder');
        
        if (frameData) {
            videoFeed.src = `data:image/jpeg;base64,${frameData}`;
            videoFeed.style.display = 'block';
            videoPlaceholder.style.display = 'none';
        }
    }

    updateAnalytics(analytics) {
        if (!analytics) return;
        
        // Update metric displays
        document.getElementById('crowdDensity').textContent = 
            `${(analytics.crowd_density * 100).toFixed(1)}%`;
        document.getElementById('safetyScore').textContent = 
            `${analytics.safety_score.toFixed(0)}%`;
        document.getElementById('personCount').textContent = 
            analytics.person_count;
        document.getElementById('activeAlerts').textContent = 
            analytics.active_alerts || 0;
        
        // Update charts with new data
        this.updateCharts(analytics);
    }

    updateCharts(analytics) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        
        // Add new data points
        this.timeLabels.push(timeLabel);
        this.densityData.push(analytics.crowd_density * 100);
        this.peopleData.push(analytics.person_count);
        
        // Keep only last 20 data points
        if (this.timeLabels.length > 20) {
            this.timeLabels.shift();
            this.densityData.shift();
            this.peopleData.shift();
        }
        
        // Update density chart
        if (this.charts.density) {
            this.charts.density.data.labels = [...this.timeLabels];
            this.charts.density.data.datasets[0].data = [...this.densityData];
            this.charts.density.update('none');
        }
        
        // Update people chart
        if (this.charts.people) {
            this.charts.people.data.labels = [...this.timeLabels];
            this.charts.people.data.datasets[0].data = [...this.peopleData];
            this.charts.people.update('none');
        }
    }

    handleAlert(alertData) {
        if (!alertData || !alertData.triggered) return;
        
        // Add alert to list
        this.alerts.unshift({
            id: Date.now(),
            message: alertData.message,
            severity: 'high',
            timestamp: new Date()
        });
        
        // Keep only last 10 alerts
        if (this.alerts.length > 10) {
            this.alerts.pop();
        }
        
        this.updateAlertsDisplay();
        this.showNotification(alertData.message, 'warning');
        
        // Add to event log
        this.addEventLog('ALERT', alertData.message);
    }

    updateAlertsDisplay() {
        const alertsList = document.getElementById('alertsList');
        
        if (this.alerts.length === 0) {
            alertsList.innerHTML = `
                <div style="text-align: center; color: #718096; padding: 2rem;">
                    No active alerts
                </div>
            `;
            return;
        }
        
        alertsList.innerHTML = this.alerts.map(alert => `
            <div class="alert-item alert-${alert.severity}">
                <div>${alert.message}</div>
                <div class="alert-time">${alert.timestamp.toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    addEventLog(type, message) {
        this.eventLogs.unshift({
            type,
            message,
            timestamp: new Date()
        });
        
        // Keep only last 50 logs
        if (this.eventLogs.length > 50) {
            this.eventLogs.pop();
        }
        
        this.updateEventLogDisplay();
    }

    updateEventLogDisplay() {
        const eventLog = document.getElementById('eventLog');
        
        if (this.eventLogs.length === 0) {
            eventLog.innerHTML = `
                <div style="text-align: center; color: #718096; padding: 2rem;">
                    No events logged
                </div>
            `;
            return;
        }
        
        eventLog.innerHTML = this.eventLogs.map(log => `
            <div class="log-item">
                <div><strong>${log.type}:</strong> ${log.message}</div>
                <div class="log-time">${log.timestamp.toLocaleTimeString()}</div>
            </div>
        `).join('');
    }

    initializeCharts() {
        // Density chart
        const densityCtx = document.getElementById('densityChart').getContext('2d');
        this.charts.density = new Chart(densityCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Crowd Density (%)',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
        
        // People chart
        const peopleCtx = document.getElementById('peopleChart').getContext('2d');
        this.charts.people = new Chart(peopleCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'People Count',
                    data: [],
                    backgroundColor: '#ed8936',
                    borderColor: '#dd6b20',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                },
                animation: {
                    duration: 0
                }
            }
        });
    }

    initializeMap() {
        // Initialize Leaflet map
        this.map = L.map('map').setView([40.7128, -74.0060], 15); // Default to NYC
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
        
        // Add sample event zone
        const eventZone = L.circle([40.7128, -74.0060], {
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.2,
            radius: 100
        }).addTo(this.map);
        
        eventZone.bindPopup('<b>Event Zone</b><br>Main monitoring area');
    }

    async loadInitialData() {
        try {
            // Load initial alerts
            const alertsResponse = await fetch('/api/alerts?limit=10');
            const alertsData = await alertsResponse.json();
            
            if (alertsData.alerts) {
                this.alerts = alertsData.alerts.map(alert => ({
                    id: alert.id,
                    message: alert.message,
                    severity: alert.severity,
                    timestamp: new Date(alert.timestamp)
                }));
                this.updateAlertsDisplay();
            }
            
            // Load initial event logs
            const logsResponse = await fetch('/api/logs?limit=20');
            const logsData = await logsResponse.json();
            
            if (logsData.logs) {
                this.eventLogs = logsData.logs.map(log => ({
                    type: log.event_type.toUpperCase(),
                    message: log.description,
                    timestamp: new Date(log.timestamp)
                }));
                this.updateEventLogDisplay();
            }
            
            // Check system status
            const statusResponse = await fetch('/api/status');
            const statusData = await statusResponse.json();
            
            if (statusData.monitoring_active) {
                this.isMonitoring = true;
                this.updateMonitoringUI(true);
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    updateConnectionStatus(connected) {
        // Update UI to show connection status
        const statusElement = document.getElementById('statusIndicator');
        if (connected) {
            statusElement.style.border = '2px solid #48bb78';
        } else {
            statusElement.style.border = '2px solid #f56565';
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) {
            existing.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.crowdSafeDashboard = new CrowdSafeDashboard();
});