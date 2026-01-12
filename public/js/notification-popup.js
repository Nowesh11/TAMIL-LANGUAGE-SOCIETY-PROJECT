/**
 * Real-time Notification Popup Component
 * Displays beautiful popup notifications with animations
 */
class NotificationPopup {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.maxNotifications = 5;
        this.defaultDuration = 5000; // 5 seconds
        this.init();
    }

    init() {
        this.createContainer();
        this.addStyles();
    }

    createContainer() {
        // Create the popup container
        this.container = document.createElement('div');
        this.container.id = 'notification-popup-container';
        this.container.className = 'notification-popup-container';
        document.body.appendChild(this.container);
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .notification-popup-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            }

            .notification-popup {
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                margin-bottom: 12px;
                padding: 16px 20px;
                border-left: 4px solid #3b82f6;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .notification-popup.show {
                transform: translateX(0);
                opacity: 1;
            }

            .notification-popup.hide {
                transform: translateX(100%);
                opacity: 0;
                margin-bottom: 0;
                padding-top: 0;
                padding-bottom: 0;
                max-height: 0;
            }

            .notification-popup::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                transform: scaleX(0);
                transform-origin: left;
                animation: progress var(--duration) linear;
            }

            @keyframes progress {
                to {
                    transform: scaleX(1);
                }
            }

            .notification-popup.urgent {
                border-left-color: #ef4444;
                background: linear-gradient(135deg, #fef2f2, #ffffff);
            }

            .notification-popup.urgent::before {
                background: linear-gradient(90deg, #ef4444, #f97316);
            }

            .notification-popup.success {
                border-left-color: #10b981;
                background: linear-gradient(135deg, #f0fdf4, #ffffff);
            }

            .notification-popup.success::before {
                background: linear-gradient(90deg, #10b981, #059669);
            }

            .notification-popup.warning {
                border-left-color: #f59e0b;
                background: linear-gradient(135deg, #fffbeb, #ffffff);
            }

            .notification-popup.warning::before {
                background: linear-gradient(90deg, #f59e0b, #d97706);
            }

            .notification-popup.error {
                border-left-color: #ef4444;
                background: linear-gradient(135deg, #fef2f2, #ffffff);
            }

            .notification-popup.error::before {
                background: linear-gradient(90deg, #ef4444, #dc2626);
            }

            .notification-popup.announcement {
                border-left-color: #8b5cf6;
                background: linear-gradient(135deg, #faf5ff, #ffffff);
            }

            .notification-popup.announcement::before {
                background: linear-gradient(90deg, #8b5cf6, #7c3aed);
            }

            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .notification-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                margin-right: 12px;
                flex-shrink: 0;
            }

            .notification-icon.info { background: #3b82f6; }
            .notification-icon.success { background: #10b981; }
            .notification-icon.warning { background: #f59e0b; }
            .notification-icon.error { background: #ef4444; }
            .notification-icon.urgent { background: #ef4444; animation: pulse 1s infinite; }
            .notification-icon.announcement { background: #8b5cf6; }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            .notification-title {
                font-weight: 600;
                font-size: 14px;
                color: #1f2937;
                margin: 0;
                flex-grow: 1;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                color: #6b7280;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .notification-close:hover {
                background: #f3f4f6;
                color: #374151;
            }

            .notification-content {
                font-size: 13px;
                color: #4b5563;
                line-height: 1.4;
                margin-bottom: 8px;
            }

            .notification-meta {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 11px;
                color: #9ca3af;
            }

            .notification-time {
                font-weight: 500;
            }

            .notification-priority {
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .notification-priority.high { background: #fef2f2; color: #dc2626; }
            .notification-priority.medium { background: #fffbeb; color: #d97706; }
            .notification-priority.low { background: #f0fdf4; color: #059669; }
            .notification-priority.urgent { 
                background: #ef4444; 
                color: white; 
                animation: glow 2s infinite;
            }

            @keyframes glow {
                0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
                50% { box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); }
            }

            .notification-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }

            .notification-action {
                padding: 4px 12px;
                border: 1px solid #d1d5db;
                background: white;
                color: #374151;
                border-radius: 6px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .notification-action:hover {
                background: #f9fafb;
                border-color: #9ca3af;
            }

            .notification-action.primary {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .notification-action.primary:hover {
                background: #2563eb;
            }

            /* Mobile responsiveness */
            @media (max-width: 640px) {
                .notification-popup-container {
                    left: 20px;
                    right: 20px;
                    max-width: none;
                }

                .notification-popup {
                    transform: translateY(-100%);
                }

                .notification-popup.show {
                    transform: translateY(0);
                }

                .notification-popup.hide {
                    transform: translateY(-100%);
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(notification, options = {}) {
        const {
            duration = this.defaultDuration,
            persistent = false,
            actions = []
        } = options;

        // Remove oldest notification if we've reached the limit
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.hide(oldestId);
        }

        const id = notification.id || Date.now().toString();
        const popup = this.createPopup(notification, actions);
        
        // Set progress bar duration
        popup.style.setProperty('--duration', `${duration}ms`);
        
        this.container.appendChild(popup);
        this.notifications.set(id, popup);

        // Trigger animation
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });

        // Auto-hide after duration (unless persistent)
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    createPopup(notification, actions = []) {
        const popup = document.createElement('div');
        popup.className = `notification-popup ${notification.type || 'info'} ${notification.priority || ''}`;

        const iconMap = {
            info: '🔵',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            urgent: '🚨',
            announcement: '📢',
            event: '📅',
            news: '📰',
            update: '🔄'
        };

        const icon = iconMap[notification.type] || iconMap.info;

        popup.innerHTML = `
            <div class="notification-header">
                <div class="notification-header-content">
                    <div class="notification-icon ${notification.type || 'info'}">${icon}</div>
                    <h4 class="notification-title">${notification.title || 'Notification'}</h4>
                </div>
                <button class="notification-close" onclick="window.NotificationPopup.hide('${notification.id}')">&times;</button>
            </div>
            <div class="notification-content">${notification.message || notification.content || ''}</div>
            <div class="notification-meta">
                <span class="notification-time">${this.formatTime(notification.createdAt || new Date())}</span>
                ${notification.priority ? `<span class="notification-priority ${notification.priority}">${notification.priority}</span>` : ''}
            </div>
            ${actions.length > 0 ? `
                <div class="notification-actions">
                    ${actions.map(action => `
                        <button class="notification-action ${action.primary ? 'primary' : ''}" 
                                onclick="${action.onClick}">${action.label}</button>
                    `).join('')}
                </div>
            ` : ''}
        `;

        return popup;
    }

    hide(id) {
        const popup = this.notifications.get(id);
        if (popup) {
            popup.classList.add('hide');
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.parentNode.removeChild(popup);
                }
                this.notifications.delete(id);
            }, 300);
        }
    }

    hideAll() {
        this.notifications.forEach((popup, id) => {
            this.hide(id);
        });
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    // Static methods for easy access
    static show(notification, options) {
        if (!window.NotificationPopup) {
            window.NotificationPopup = new NotificationPopup();
        }
        return window.NotificationPopup.show(notification, options);
    }

    static hide(id) {
        if (window.NotificationPopup) {
            window.NotificationPopup.hide(id);
        }
    }

    static hideAll() {
        if (window.NotificationPopup) {
            window.NotificationPopup.hideAll();
        }
    }
}

// Initialize global instance only if it doesn't exist
if (!window.NotificationPopup) {
    window.NotificationPopup = new NotificationPopup();
}

// Example usage:
// NotificationPopup.show({
//     id: '1',
//     type: 'success',
//     priority: 'high',
//     title: 'Welcome!',
//     message: 'Your account has been successfully created.',
//     createdAt: new Date()
// }, {
//     duration: 5000,
//     actions: [
//         { label: 'View Profile', onClick: 'viewProfile()', primary: true },
//         { label: 'Dismiss', onClick: 'NotificationPopup.hide("1")' }
//     ]
// });