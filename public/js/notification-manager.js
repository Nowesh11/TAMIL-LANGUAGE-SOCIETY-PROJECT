/**
 * Notification Manager - Handles all notification operations with database integration
 */
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.currentFilter = 'all';
        this.isLoading = false;
        this.api = new NotificationAPI();
        this.init();
    }

    async init() {
        await this.loadNotifications();
        this.initializeFilters();
        this.initializeSettings();
        this.setupEventListeners();
    }

    async loadNotifications() {
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            const response = await this.api.fetchNotifications();
            if (response.success) {
                this.notifications = response.notifications;
                this.renderNotifications();
                this.updateStats();
            } else {
                this.showError('Failed to load notifications');
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showError('Failed to load notifications');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    renderNotifications() {
        const container = document.getElementById('notifications-list');
        const emptyState = document.getElementById('empty-state');
        
        if (!container) return;

        let filteredNotifications = this.getFilteredNotifications();
        
        if (filteredNotifications.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        container.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = filteredNotifications.map(notification => 
            this.createNotificationHTML(notification)
        ).join('');

        // Add event listeners to notification items
        this.attachNotificationEventListeners();
    }

    createNotificationHTML(notification) {
        const isRead = notification.isRead;
        const typeIcon = this.getTypeIcon(notification.type);
        const priorityClass = this.getPriorityClass(notification.priority);
        const timeAgo = this.getTimeAgo(new Date(notification.startAt || notification.createdAt));
        
        // Handle bilingual content
        const title = typeof notification.title === 'object' ? 
            (notification.title.en || notification.title.ta || 'No title') : 
            notification.title;
        const message = typeof notification.message === 'object' ? 
            (notification.message.en || notification.message.ta || 'No message') : 
            notification.message;

        return `
            <div class="notification-item ${isRead ? 'read' : 'unread'} ${priorityClass}" 
                 data-id="${notification._id}" 
                 data-type="${notification.type}">
                
                <div class="notification-content">
                    <div class="notification-icon notification-icon-${notification.type}">
                        <i class="${typeIcon}"></i>
                    </div>
                    
                    <div class="notification-body">
                        <div class="notification-header">
                            <h4 class="notification-title">
                                ${title}
                            </h4>
                            <div class="notification-meta">
                                ${notification.priority === 'high' ? '<span class="priority-badge">HIGH</span>' : ''}
                                <span class="notification-time">${timeAgo}</span>
                            </div>
                        </div>
                        
                        <p class="notification-message">
                            ${message}
                        </p>
                        
                        <div class="notification-actions">
                            <div class="notification-buttons">
                                ${notification.actionUrl ? `
                                    <button class="notification-action-btn" data-action="${notification.actionUrl}">
                                        ${notification.actionText || 'View'}
                                    </button>
                                ` : ''}
                                ${!isRead ? `
                                    <button class="mark-read-btn" data-id="${notification._id}">
                                        Mark as Read
                                    </button>
                                ` : ''}
                            </div>
                            
                            <div class="notification-tags">
                                <span class="notification-type-badge notification-type-${notification.type}">${notification.type}</span>
                                ${!isRead ? '<div class="unread-indicator"></div>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getFilteredNotifications() {
        let filtered = [...this.notifications];

        switch (this.currentFilter) {
            case 'unread':
                filtered = filtered.filter(n => !n.isRead);
                break;
            case 'urgent':
                filtered = filtered.filter(n => n.type === 'urgent');
                break;
            case 'announcement':
                filtered = filtered.filter(n => n.type === 'announcement');
                break;
            case 'news':
                filtered = filtered.filter(n => n.type === 'news');
                break;
            case 'general':
                filtered = filtered.filter(n => n.type === 'general');
                break;
            case 'update':
                filtered = filtered.filter(n => n.type === 'update');
                break;
        }

        // Sort by priority and date
        return filtered.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            const aDate = new Date(a.startAt || a.createdAt);
            const bDate = new Date(b.startAt || b.createdAt);
            return bDate - aDate;
        });
    }

    attachNotificationEventListeners() {
        // Mark as read buttons
        document.querySelectorAll('.mark-read-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const notificationId = btn.dataset.id;
                await this.markAsRead(notificationId);
            });
        });

        // Action buttons
        document.querySelectorAll('.notification-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action) {
                    window.open(action, '_blank');
                }
            });
        });

        // Notification items (click to mark as read)
        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const notificationId = item.dataset.id;
                const notification = this.notifications.find(n => n._id === notificationId);
                if (notification && !notification.isRead) {
                    await this.markAsRead(notificationId);
                }
            });
        });
    }

    async markAsRead(notificationId) {
        try {
            const response = await this.api.markAsRead(notificationId);
            if (response.success) {
                // Update local state
                const notification = this.notifications.find(n => n._id === notificationId);
                if (notification) {
                    notification.isRead = true;
                    notification.readAt = new Date();
                }
                this.renderNotifications();
                this.updateStats();
                this.showToast('Notification marked as read', 'success');
            } else {
                this.showToast('Failed to mark notification as read', 'error');
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            this.showToast('Failed to mark notification as read', 'error');
        }
    }

    async markAllAsRead() {
        try {
            const response = await this.api.markAllAsRead();
            if (response.success) {
                // Update local state
                this.notifications.forEach(n => {
                    n.isRead = true;
                    n.readAt = new Date();
                });
                this.renderNotifications();
                this.updateStats();
                this.showToast('All notifications marked as read', 'success');
            } else {
                this.showToast('Failed to mark all notifications as read', 'error');
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            this.showToast('Failed to mark all notifications as read', 'error');
        }
    }

    updateStats() {
        const totalCount = this.notifications.length;
        const unreadCount = this.notifications.filter(n => !n.isRead).length;
        const readCount = totalCount - unreadCount;

        // Update stats display
        const totalElement = document.getElementById('total-notifications');
        const unreadElement = document.getElementById('unread-notifications');
        const readElement = document.getElementById('read-notifications');

        if (totalElement) totalElement.textContent = totalCount;
        if (unreadElement) unreadElement.textContent = unreadCount;
        if (readElement) readElement.textContent = readCount;

        // Update page title with unread count
        if (unreadCount > 0) {
            document.title = `(${unreadCount}) Notifications - Tamil Language Society`;
        } else {
            document.title = 'Notifications - Tamil Language Society';
        }
    }

    initializeFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Update current filter
                this.currentFilter = btn.dataset.filter;
                
                // Re-render notifications
                this.renderNotifications();
            });
        });
    }

    initializeSettings() {
        // Load notification preferences from localStorage
        const preferences = JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
        
        // Apply preferences to form elements
        Object.keys(preferences).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = preferences[key];
                } else {
                    element.value = preferences[key];
                }
            }
        });
    }

    setupEventListeners() {
        // Mark all as read button
        const markAllBtn = document.getElementById('mark-all-read');
        if (markAllBtn) {
            markAllBtn.addEventListener('click', () => this.markAllAsRead());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-notifications');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadNotifications());
        }

        // Settings form
        const settingsForm = document.getElementById('notification-settings-form');
        if (settingsForm) {
            settingsForm.addEventListener('change', (e) => {
                this.savePreferences();
            });
        }
    }

    savePreferences() {
        const form = document.getElementById('notification-settings-form');
        if (!form) return;

        const preferences = {};
        const formData = new FormData(form);
        
        for (let [key, value] of formData.entries()) {
            preferences[key] = value;
        }

        // Handle checkboxes separately
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            preferences[checkbox.name] = checkbox.checked;
        });

        localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
        this.showToast('Preferences saved', 'success');
    }

    getTypeIcon(type) {
        const icons = {
            urgent: 'fas fa-exclamation-triangle',
            announcement: 'fas fa-bullhorn',
            general: 'fas fa-info-circle',
            update: 'fas fa-sync-alt',
            news: 'fas fa-newspaper'
        };
        return icons[type] || 'fas fa-bell';
    }

    getTypeColor(type) {
        const colors = {
            urgent: '#e74c3c',
            announcement: '#f39c12',
            general: '#3498db',
            update: '#2ecc71',
            news: '#9b59b6'
        };
        return colors[type] || '#95a5a6';
    }

    getPriorityClass(priority) {
        return `priority-${priority}`;
    }

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    showLoadingState() {
        const container = document.getElementById('notifications-list');
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <i class="fas fa-spinner fa-spin loading-spinner"></i>
                    <p>Loading notifications...</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Loading state will be replaced by renderNotifications()
    }

    showError(message) {
        const container = document.getElementById('notifications-list');
        if (container) {
            container.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle error-icon"></i>
                    <p>${message}</p>
                    <button onclick="notificationManager.loadNotifications()" class="retry-button">
                        Try Again
                    </button>
                </div>
            `;
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});