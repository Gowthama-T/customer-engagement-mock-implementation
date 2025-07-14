/**
 * Dashboard JavaScript for Mock Customer Engagement Platform
 * Handles analytics visualization, charts, and real-time updates
 */

class Dashboard {
    constructor() {
        this.charts = {};
        this.autoRefreshInterval = null;
        this.currentPage = 1;
        this.eventsPerPage = 10;
        this.lastUpdateTime = null;
        
        this.init();
    }

    async init() {
        console.log('📊 Initializing Dashboard...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        console.log('✅ Dashboard initialized successfully');
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('refreshDashboard').addEventListener('click', () => {
            this.loadDashboardData();
        });

        // Auto-refresh checkbox
        document.getElementById('autoRefresh').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.setupAutoRefresh();
            } else {
                this.clearAutoRefresh();
            }
        });

        // Load more events button
        document.getElementById('loadMoreEvents').addEventListener('click', () => {
            this.loadMoreEvents();
        });

        // Export buttons
        document.getElementById('exportEvents').addEventListener('click', () => {
            this.exportData('events');
        });

        document.getElementById('exportUsers').addEventListener('click', () => {
            this.exportData('users');
        });

        document.getElementById('exportAnalytics').addEventListener('click', () => {
            this.exportData('analytics');
        });
    }

    async loadDashboardData() {
        console.log('🔄 Loading dashboard data...');
        
        try {
            // Show loading state
            this.showLoadingState(true);
            
            // Load all data in parallel
            const [analyticsResult, eventsResult, usersResult] = await Promise.all([
                window.engage.getAnalytics(),
                window.engage.getEvents(1, this.eventsPerPage),
                window.engage.getUsers()
            ]);

            // Update metrics
            if (analyticsResult.success) {
                this.updateMetrics(analyticsResult.data.data);
                this.updateCharts(analyticsResult.data.data);
            }

            // Update events timeline
            if (eventsResult.success) {
                this.updateEventTimeline(eventsResult.data.events);
                this.currentPage = 1;
            }

            // Update users list
            if (usersResult.success) {
                this.updateUsersList(usersResult.data.users);
            }

            // Update last refresh time
            this.lastUpdateTime = new Date();
            this.updateLastUpdatedDisplay();

            console.log('✅ Dashboard data loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data: ' + error.message);
        } finally {
            this.showLoadingState(false);
        }
    }

    updateMetrics(data) {
        // Update metric cards
        document.getElementById('totalEvents').textContent = data.total_events || 0;
        document.getElementById('dailyActiveUsers').textContent = data.daily_active_users || 0;
        document.getElementById('totalUsers').textContent = data.total_users || 0;
        
        // Calculate engagement rate
        const engagementRate = data.total_users > 0 
            ? Math.round((data.daily_active_users / data.total_users) * 100) 
            : 0;
        document.getElementById('engagementRate').textContent = engagementRate + '%';
    }

    updateCharts(data) {
        // Update Top Actions Chart
        this.updateTopActionsChart(data.top_actions || []);
        
        // Update Daily Events Chart
        this.updateDailyEventsChart(data.daily_events || []);
    }

    updateTopActionsChart(topActions) {
        const ctx = document.getElementById('topActionsChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.topActions) {
            this.charts.topActions.destroy();
        }

        const labels = topActions.map(item => item.action);
        const data = topActions.map(item => item.count);
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

        this.charts.topActions = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, data.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateDailyEventsChart(dailyEvents) {
        const ctx = document.getElementById('dailyEventsChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.dailyEvents) {
            this.charts.dailyEvents.destroy();
        }

        // Prepare data for last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const labels = last7Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const data = last7Days.map(date => {
            const dayData = dailyEvents.find(item => item.date === date);
            return dayData ? dayData.count : 0;
        });

        this.charts.dailyEvents = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Events',
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    updateEventTimeline(events) {
        const timeline = document.getElementById('eventTimeline');
        
        if (!events || events.length === 0) {
            timeline.innerHTML = '<p class="text-center">No events found.</p>';
            return;
        }

        const eventsHTML = events.map(event => {
            const timestamp = new Date(event.timestamp);
            const timeString = timestamp.toLocaleString();
            
            return `
                <div class="status-message status-info">
                    <strong>${event.action}</strong> - User: ${event.user_id}
                    <br><small>📅 ${timeString}</small>
                    ${event.properties && Object.keys(event.properties).length > 0 
                        ? `<br><small>📝 Properties: ${JSON.stringify(event.properties)}</small>` 
                        : ''}
                </div>
            `;
        }).join('');

        timeline.innerHTML = eventsHTML;
    }

    async loadMoreEvents() {
        const button = document.getElementById('loadMoreEvents');
        const originalText = button.textContent;
        
        button.disabled = true;
        button.textContent = 'Loading...';

        try {
            this.currentPage++;
            const result = await window.engage.getEvents(this.currentPage, this.eventsPerPage);
            
            if (result.success && result.data.events.length > 0) {
                // Append new events to existing timeline
                const timeline = document.getElementById('eventTimeline');
                const newEventsHTML = result.data.events.map(event => {
                    const timestamp = new Date(event.timestamp);
                    const timeString = timestamp.toLocaleString();
                    
                    return `
                        <div class="status-message status-info">
                            <strong>${event.action}</strong> - User: ${event.user_id}
                            <br><small>📅 ${timeString}</small>
                        </div>
                    `;
                }).join('');
                
                timeline.innerHTML += newEventsHTML;
            } else {
                button.textContent = 'No more events';
                button.disabled = true;
                return;
            }

        } catch (error) {
            console.error('Failed to load more events:', error);
            this.currentPage--; // Revert page increment
        } finally {
            if (button.textContent !== 'No more events') {
                button.disabled = false;
                button.textContent = originalText;
            }
        }
    }

    updateUsersList(users) {
        const usersList = document.getElementById('usersList');
        
        if (!users || users.length === 0) {
            usersList.innerHTML = '<p class="text-center">No users found.</p>';
            return;
        }

        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td><strong>${user.user_id}</strong></td>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        usersList.innerHTML = tableHTML;
    }

    setupAutoRefresh() {
        this.clearAutoRefresh();
        
        this.autoRefreshInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing dashboard...');
            this.loadDashboardData();
        }, 30000); // 30 seconds

        this.updateConnectionStatus('🟢 Auto-refresh enabled');
    }

    clearAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        this.updateConnectionStatus('🔴 Auto-refresh disabled');
    }

    updateConnectionStatus(status) {
        const statusDiv = document.getElementById('connectionStatus');
        statusDiv.innerHTML = `<span class="status-message status-info">${status}</span>`;
    }

    updateLastUpdatedDisplay() {
        if (this.lastUpdateTime) {
            const timeString = this.lastUpdateTime.toLocaleTimeString();
            document.getElementById('lastUpdated').textContent = `Last updated: ${timeString}`;
        }
    }

    async exportData(type) {
        try {
            let data, filename;
            
            switch (type) {
                case 'events':
                    const eventsResult = await window.engage.getEvents(1, 1000); // Get more events for export
                    if (!eventsResult.success) throw new Error('Failed to fetch events');
                    data = this.convertToCSV(eventsResult.data.events);
                    filename = `events_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                    
                case 'users':
                    const usersResult = await window.engage.getUsers();
                    if (!usersResult.success) throw new Error('Failed to fetch users');
                    data = this.convertToCSV(usersResult.data.users);
                    filename = `users_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                    
                case 'analytics':
                    const analyticsResult = await window.engage.getAnalytics();
                    if (!analyticsResult.success) throw new Error('Failed to fetch analytics');
                    data = JSON.stringify(analyticsResult.data, null, 2);
                    filename = `analytics_${new Date().toISOString().split('T')[0]}.json`;
                    break;
                    
                default:
                    throw new Error('Unknown export type');
            }
            
            this.downloadFile(data, filename);
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed: ' + error.message);
        }
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // Handle JSON objects and escape quotes
                    if (typeof value === 'object') {
                        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                    }
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { 
            type: filename.endsWith('.json') ? 'application/json' : 'text/csv' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showLoadingState(loading) {
        const refreshBtn = document.getElementById('refreshDashboard');
        
        if (loading) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<div class="loading"></div> Loading...';
        } else {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Refresh Data';
        }
    }

    showError(message) {
        console.error(message);
        
        // You could add a global error display here
        // For now, we'll just log it
    }

    // Get dashboard status for debugging
    getStatus() {
        return {
            autoRefreshEnabled: !!this.autoRefreshInterval,
            currentPage: this.currentPage,
            lastUpdate: this.lastUpdateTime,
            chartsInitialized: Object.keys(this.charts).length
        };
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    console.log('📈 Dashboard loaded successfully!');
});

// Export for debugging
window.Dashboard = Dashboard;