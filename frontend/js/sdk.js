/**
 * Mock Customer Engagement Platform SDK
 * Simulates real SDK integration for tracking user events
 */

class EngagementSDK {
    constructor(config = {}) {
        this.apiBaseUrl = config.apiBaseUrl || 'http://localhost:5000/api';
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.debug = config.debug || false;
        this.eventQueue = [];
        this.isOnline = navigator.onLine;
        
        // Initialize SDK
        this.init();
    }

    init() {
        this.log('SDK initialized');
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.log('Network connection restored');
            this.flushEventQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.log('Network connection lost');
        });
        
        // Auto-flush event queue every 30 seconds
        setInterval(() => {
            if (this.isOnline && this.eventQueue.length > 0) {
                this.flushEventQueue();
            }
        }, 30000);
    }

    /**
     * Track user event
     * @param {string} userId - User identifier
     * @param {string} action - Action name
     * @param {Object} properties - Additional event properties
     */
    async trackEvent(userId, action, properties = {}) {
        if (!userId || !action) {
            this.log('Error: userId and action are required', 'error');
            return { success: false, error: 'Missing required parameters' };
        }

        const eventData = {
            user_id: userId,
            action: action,
            timestamp: new Date().toISOString(),
            properties: properties
        };

        this.log(`Tracking event: ${action} for user ${userId}`, 'info');

        if (!this.isOnline) {
            this.log('Offline: Adding event to queue', 'warn');
            this.eventQueue.push(eventData);
            return { success: true, queued: true };
        }

        return await this.sendEvent(eventData);
    }

    /**
     * Send event to API with retry logic
     */
    async sendEvent(eventData, attempt = 1) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.log(`Event tracked successfully: ${eventData.action}`, 'success');
            
            return {
                success: true,
                data: result,
                attempt: attempt
            };

        } catch (error) {
            this.log(`Event tracking failed (attempt ${attempt}): ${error.message}`, 'error');

            if (attempt < this.retryAttempts) {
                this.log(`Retrying in ${this.retryDelay}ms...`, 'warn');
                await this.delay(this.retryDelay);
                return await this.sendEvent(eventData, attempt + 1);
            } else {
                // Add to queue for later retry
                this.eventQueue.push(eventData);
                return {
                    success: false,
                    error: error.message,
                    queued: true,
                    attempts: attempt
                };
            }
        }
    }

    /**
     * Flush queued events
     */
    async flushEventQueue() {
        if (this.eventQueue.length === 0) return;

        this.log(`Flushing ${this.eventQueue.length} queued events`);
        const queuedEvents = [...this.eventQueue];
        this.eventQueue = [];

        for (const event of queuedEvents) {
            const result = await this.sendEvent(event);
            if (!result.success && !result.queued) {
                // If failed and not re-queued, add back to queue
                this.eventQueue.push(event);
            }
        }
    }

    /**
     * Batch track multiple events
     */
    async trackBatch(events) {
        const results = [];
        
        for (const event of events) {
            const result = await this.trackEvent(
                event.user_id,
                event.action,
                event.properties
            );
            results.push(result);
        }
        
        return results;
    }

    /**
     * Get API health status
     */
    async getApiHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return { success: true, data };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Upload CSV file
     */
    async uploadCSV(file) {
        if (!file || !file.name.endsWith('.csv')) {
            return { success: false, error: 'Invalid file format. Please upload a CSV file.' };
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.apiBaseUrl}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.log(`CSV uploaded successfully: ${file.name}`, 'success');
            
            return { success: true, data: result };

        } catch (error) {
            this.log(`CSV upload failed: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Fetch analytics data
     */
    async getAnalytics() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/analytics`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return { success: true, data: result };
            
        } catch (error) {
            this.log(`Failed to fetch analytics: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Fetch users list
     */
    async getUsers() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/users`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return { success: true, data: result };
            
        } catch (error) {
            this.log(`Failed to fetch users: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Fetch events with pagination
     */
    async getEvents(page = 1, perPage = 20) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/events?page=${page}&per_page=${perPage}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return { success: true, data: result };
            
        } catch (error) {
            this.log(`Failed to fetch events: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Utility: Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Utility: Logging
     */
    log(message, level = 'info') {
        if (!this.debug && level === 'info') return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[EngagementSDK ${timestamp}]`;
        
        switch (level) {
            case 'error':
                console.error(`${prefix} ❌`, message);
                break;
            case 'warn':
                console.warn(`${prefix} ⚠️`, message);
                break;
            case 'success':
                console.log(`${prefix} ✅`, message);
                break;
            default:
                console.log(`${prefix} ℹ️`, message);
        }
    }

    /**
     * Get SDK status information
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            queuedEvents: this.eventQueue.length,
            apiBaseUrl: this.apiBaseUrl,
            initialized: true
        };
    }
}

// Initialize global SDK instance
window.EngagementSDK = EngagementSDK;

// Auto-initialize with default config if not manually initialized
if (typeof window !== 'undefined') {
    window.engage = new EngagementSDK({ debug: true });
    console.log('🚀 Mock Customer Engagement Platform SDK loaded and ready!');
}