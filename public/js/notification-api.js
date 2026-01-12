/**
 * Notification API Client
 * Handles all notification-related API calls
 */
class NotificationAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/notifications';
        this.authToken = this.getAuthToken();
    }

    /**
     * Get authentication token from localStorage or session
     */
    getAuthToken() {
        // Try to get token from localStorage first
        let token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
        
        // If not found, try sessionStorage
        if (!token) {
            token = sessionStorage.getItem('authToken') || sessionStorage.getItem('accessToken');
        }
        
        return token;
    }

    /**
     * Get request headers with authentication
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        return headers;
    }

    /**
     * Fetch notifications with optional filters
     * @param {Object} options - Query options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.limit - Items per page (default: 20)
     * @param {string} options.type - Notification type filter
     * @param {string} options.priority - Priority filter
     * @param {boolean} options.unreadOnly - Show only unread notifications
     */
    async fetchNotifications(options = {}) {
        try {
            const params = new URLSearchParams();
            
            if (options.page) params.set('page', options.page.toString());
            if (options.limit) params.set('limit', options.limit.toString());
            if (options.type) params.set('type', options.type);
            if (options.priority) params.set('priority', options.priority);
            if (options.unreadOnly) params.set('unreadOnly', 'true');

            const url = `http://localhost:3000/api/notifications${params.toString() ? '?' + params.toString() : ''}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                notifications: data.notifications || [],
                pagination: data.pagination || {},
                unreadCount: data.unreadCount || 0
            };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return {
                success: false,
                error: error.message,
                notifications: [],
                pagination: {},
                unreadCount: 0
            };
        }
    }

    /**
     * Mark a specific notification as read
     * @param {string} notificationId - The notification ID
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`${this.baseURL}/${notificationId}/read`, {
                method: 'PUT',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message || 'Notification marked as read'
            };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead() {
        try {
            const response = await fetch(this.baseURL, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    action: 'markAllRead'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message || 'All notifications marked as read'
            };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Mark multiple notifications as read
     * @param {string[]} notificationIds - Array of notification IDs
     */
    async markMultipleAsRead(notificationIds) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    action: 'markRead',
                    notificationIds: notificationIds
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message || 'Notifications marked as read'
            };
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create a new notification (admin only)
     * @param {Object} notificationData - Notification data
     */
    async createNotification(notificationData) {
        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(notificationData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                notification: data.notification,
                message: 'Notification created successfully'
            };
        } catch (error) {
            console.error('Error creating notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete a notification (admin only)
     * @param {string} notificationId - The notification ID
     */
    async deleteNotification(notificationId) {
        try {
            const response = await fetch(`${this.baseURL}?id=${notificationId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message || 'Notification deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get notification statistics
     */
    async getStats() {
        try {
            const result = await this.fetchNotifications({ limit: 1 });
            if (result.success) {
                return {
                    success: true,
                    total: result.pagination.total || 0,
                    unread: result.unreadCount || 0
                };
            }
            return { success: false, total: 0, unread: 0 };
        } catch (error) {
            console.error('Error getting notification stats:', error);
            return { success: false, total: 0, unread: 0 };
        }
    }
}

// Create global instance
window.notificationAPI = new NotificationAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationAPI;
}