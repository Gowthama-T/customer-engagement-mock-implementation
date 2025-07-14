/**
 * Main JavaScript for Mock Customer Engagement Platform
 * Handles user interactions, event tracking, and CSV uploads
 */

class MainApp {
    constructor() {
        this.currentUser = null;
        this.recentEvents = [];
        this.maxRecentEvents = 10;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Main App...');
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadUsers();
        await this.checkApiStatus();
        
        console.log('✅ Main App initialized successfully');
    }

    setupEventListeners() {
        // Action buttons
        document.getElementById('loginBtn').addEventListener('click', (e) => {
            this.handleActionClick(e, 'Login');
        });
        
        document.getElementById('addToCartBtn').addEventListener('click', (e) => {
            this.handleActionClick(e, 'AddToCart');
        });
        
        document.getElementById('checkoutBtn').addEventListener('click', (e) => {
            this.handleActionClick(e, 'Checkout');
        });

        // User selection
        document.getElementById('userSelect').addEventListener('change', (e) => {
            this.currentUser = e.target.value;
            this.updateActionButtonsState();
        });

        document.getElementById('refreshUsers').addEventListener('click', () => {
            this.loadUsers();
        });

        // CSV Upload
        document.getElementById('selectFileBtn').addEventListener('click', () => {
            document.getElementById('csvFile').click();
        });

        document.getElementById('csvFile').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // API test button
        document.getElementById('testApiBtn').addEventListener('click', () => {
            this.checkApiStatus();
        });
    }

    async handleActionClick(event, action) {
        const button = event.target;
        
        if (!this.currentUser) {
            this.showStatus('Please select a user first', 'error');
            return;
        }

        // Update button state
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<div class="loading"></div> Tracking...';

        try {
            // Track the event using SDK
            const result = await window.engage.trackEvent(this.currentUser, action, {
                source: 'web_ui',
                timestamp: new Date().toISOString(),
                button_id: button.id
            });

            if (result.success) {
                this.showStatus(
                    `✅ ${action} event tracked successfully for user ${this.currentUser}`,
                    'success'
                );
                
                // Add to recent events
                this.addRecentEvent({
                    user_id: this.currentUser,
                    action: action,
                    timestamp: new Date().toISOString(),
                    status: 'success'
                });
                
            } else {
                throw new Error(result.error || 'Failed to track event');
            }

        } catch (error) {
            console.error('Event tracking failed:', error);
            this.showStatus(`❌ Failed to track ${action}: ${error.message}`, 'error');
            
            // Add failed event to recent events
            this.addRecentEvent({
                user_id: this.currentUser,
                action: action,
                timestamp: new Date().toISOString(),
                status: 'failed',
                error: error.message
            });
        } finally {
            // Restore button state
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    async loadUsers() {
        const userSelect = document.getElementById('userSelect');
        const refreshBtn = document.getElementById('refreshUsers');
        
        // Update UI
        userSelect.innerHTML = '<option value="">Loading users...</option>';
        refreshBtn.disabled = true;

        try {
            const result = await window.engage.getUsers();
            
            if (result.success && result.data.users) {
                const users = result.data.users;
                
                // Clear and populate user select
                userSelect.innerHTML = '<option value="">Select a user...</option>';
                
                users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.user_id;
                    option.textContent = `${user.name} (${user.user_id})`;
                    userSelect.appendChild(option);
                });

                this.showStatus(`✅ Loaded ${users.length} users`, 'success');
                
            } else {
                throw new Error(result.error || 'Failed to load users');
            }

        } catch (error) {
            console.error('Failed to load users:', error);
            userSelect.innerHTML = '<option value="">Failed to load users</option>';
            this.showStatus(`❌ Failed to load users: ${error.message}`, 'error');
        } finally {
            refreshBtn.disabled = false;
        }
    }

    async handleFileUpload(file) {
        const uploadStatus = document.getElementById('uploadStatus');
        
        // Show upload progress
        uploadStatus.innerHTML = `
            <div class="status-message status-info">
                <div class="loading"></div> Uploading ${file.name}...
            </div>
        `;

        try {
            const result = await window.engage.uploadCSV(file);
            
            if (result.success) {
                const data = result.data;
                uploadStatus.innerHTML = `
                    <div class="status-message status-success">
                        ✅ Successfully uploaded ${file.name}<br>
                        Created: ${data.users_created} users<br>
                        Updated: ${data.users_updated} users
                    </div>
                `;
                
                // Refresh users list
                await this.loadUsers();
                
            } else {
                throw new Error(result.error || 'Upload failed');
            }

        } catch (error) {
            console.error('Upload failed:', error);
            uploadStatus.innerHTML = `
                <div class="status-message status-error">
                    ❌ Upload failed: ${error.message}
                </div>
            `;
        }
    }

    async checkApiStatus() {
        const statusDiv = document.getElementById('apiStatus');
        const testBtn = document.getElementById('testApiBtn');
        
        statusDiv.innerHTML = '<div class="loading"></div> Checking API connection...';
        testBtn.disabled = true;

        try {
            const result = await window.engage.getApiHealth();
            
            if (result.success) {
                const data = result.data;
                statusDiv.innerHTML = `
                    <div class="status-message status-success">
                        ✅ API is healthy<br>
                        Status: ${data.status}<br>
                        Version: ${data.version}<br>
                        Last checked: ${new Date(data.timestamp).toLocaleString()}
                    </div>
                `;
            } else {
                throw new Error(result.error || 'API health check failed');
            }

        } catch (error) {
            console.error('API health check failed:', error);
            statusDiv.innerHTML = `
                <div class="status-message status-error">
                    ❌ API connection failed: ${error.message}<br>
                    Make sure the backend server is running on port 5000
                </div>
            `;
        } finally {
            testBtn.disabled = false;
        }
    }

    updateActionButtonsState() {
        const buttons = document.querySelectorAll('[data-action]');
        const hasUser = !!this.currentUser;
        
        buttons.forEach(button => {
            button.disabled = !hasUser;
            if (!hasUser) {
                button.style.opacity = '0.5';
            } else {
                button.style.opacity = '1';
            }
        });
    }

    addRecentEvent(event) {
        this.recentEvents.unshift(event);
        
        // Keep only the most recent events
        if (this.recentEvents.length > this.maxRecentEvents) {
            this.recentEvents = this.recentEvents.slice(0, this.maxRecentEvents);
        }
        
        this.updateRecentEventsDisplay();
    }

    updateRecentEventsDisplay() {
        const eventsList = document.getElementById('eventsList');
        
        if (this.recentEvents.length === 0) {
            eventsList.innerHTML = '<p class="text-center">No events tracked yet.</p>';
            return;
        }

        const eventsHTML = this.recentEvents.map(event => {
            const statusIcon = event.status === 'success' ? '✅' : '❌';
            const timeString = new Date(event.timestamp).toLocaleTimeString();
            
            return `
                <div class="status-message ${event.status === 'success' ? 'status-success' : 'status-error'}">
                    ${statusIcon} <strong>${event.action}</strong> - User: ${event.user_id}
                    <br><small>Time: ${timeString}</small>
                    ${event.error ? `<br><small>Error: ${event.error}</small>` : ''}
                </div>
            `;
        }).join('');

        eventsList.innerHTML = eventsHTML;
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('eventStatus');
        const statusClass = `status-${type}`;
        
        statusDiv.innerHTML = `
            <div class="status-message ${statusClass}">
                ${message}
            </div>
        `;

        // Auto-hide after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.innerHTML = '<p>Ready to track events. Select a user and click action buttons above.</p>';
            }, 5000);
        }
    }

    // Utility function to format time
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleString();
    }

    // Get app status for debugging
    getStatus() {
        return {
            currentUser: this.currentUser,
            recentEvents: this.recentEvents.length,
            sdkStatus: window.engage.getStatus()
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
    console.log('📱 Main App loaded successfully!');
});

// Export for debugging
window.MainApp = MainApp;