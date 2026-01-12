import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import DynamicComponent from '../components/DynamicComponent';
import { useLanguage } from '../hooks/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { getPageContent, getPageSEO } from '../lib/getPageContent';
import styles from '../app/announcements/notifications.module.css';

interface Notification {
  _id: string;
  title: {
    en: string;
    ta: string;
  };
  message: {
    en: string;
    ta: string;
  };
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement' | 'event' | 'news' | 'update' | 'urgent' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: string;
  startAt: string;
  endAt?: string;
  actionUrl?: string;
  actionText?: {
    en: string;
    ta: string;
  };
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationPreferences {
  email: {
    announcements: boolean;
    newContent: boolean;
    weekly: boolean;
  };
  push: {
    breaking: boolean;
    newContent: boolean;
    updates: boolean;
  };
  language: 'en' | 'ta' | 'both';
}

interface NotificationsPageProps {
  pageContent?: any;
  seoData?: any;
}

export default function NotificationsPage({ pageContent, seoData }: NotificationsPageProps) {
  const [components, setComponents] = useState<any[]>([]);
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: { announcements: true, newContent: true, weekly: false },
    push: { breaking: true, newContent: false, updates: true },
    language: 'both'
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  const { lang: language } = useLanguage();
  const { user, accessToken } = useAuth();
  const router = useRouter();

  // Fetch components for the page
  useEffect(() => { fetchComponents(); }, []);

  async function fetchComponents() {
    try {
      setComponentsLoading(true);
      const response = await fetch('/api/components?page=notifications');
      if (response.ok) {
        const data = await response.json();
        setComponents(data.sort((a: any, b: any) => a.order - b.order));
      }
    } catch (error) {
      console.error('Error fetching components:', error);
    } finally {
      setComponentsLoading(false);
    }
  }

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filter !== 'all') {
        if (filter === 'unread') {
          params.set('unreadOnly', 'true');
        } else {
          params.set('type', filter);
        }
      }
      
      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setStats({
        total: data.pagination?.total || data.notifications?.length || 0,
        unread: data.unreadCount || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filter]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true, readAt: new Date().toISOString() }
              : notif
          )
        );
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAllRead' }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true, readAt: new Date().toISOString() }))
        );
        setStats(prev => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Save notification preferences
  const savePreferences = async () => {
    if (!accessToken) return;
    
    try {
      setSavingPreferences(true);
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        // Show success message or toast
        console.log('Preferences saved successfully');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSavingPreferences(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  // Load notifications on component mount and when filter changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Helper functions
  const getTypeIcon = (type: string) => {
    const icons = {
      urgent: '🚨',
      announcement: '📢',
      general: 'ℹ️',
      update: '🔄',
      news: '📰',
      event: '📅',
      info: 'ℹ️',
      warning: '⚠️',
      success: '✅',
      error: '❌'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: '#dc3545',
      high: '#fd7e14',
      medium: '#ffc107',
      low: '#28a745'
    };
    return colors[priority as keyof typeof colors] || '#6c757d';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return language === 'ta' ? 'இப்போது' : 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} ${language === 'ta' ? 'நிமிடங்களுக்கு முன்பு' : 'minutes ago'}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ${language === 'ta' ? 'மணி நேரங்களுக்கு முன்பு' : 'hours ago'}`;
    return `${Math.floor(diffInSeconds / 86400)} ${language === 'ta' ? 'நாட்களுக்கு முன்பு' : 'days ago'}`;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter || notification.priority === filter;
  });

  if (!user) {
    return (
      <>
        {componentsLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            {components.map((component, index) => (
              <DynamicComponent key={index} component={component} />
            ))}
            <main className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">
                  {language === 'ta' ? 'உள்நுழைவு தேவை' : 'Login Required'}
                </h1>
                <p className="text-gray-600 mb-4">
                  {language === 'ta' 
                    ? 'அறிவிப்புகளைப் பார்க்க தயவுசெய்து உள்நுழையவும்'
                    : 'Please log in to view notifications'
                  }
                </p>
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {language === 'ta' ? 'உள்நுழையவும்' : 'Login'}
                </button>
              </div>
            </main>
          </>
        )}
      </>
    );
  }

  return (
    <>
      {componentsLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          {components.filter(c => ['seo', 'navbar'].includes(c.type)).map((component, index) => (
            <DynamicComponent key={index} component={component} />
          ))}
          <main>
          <div className={styles.container}>
            <div className={styles.innerContainer}>
              <div className={styles.header}>
                <h1 className={styles.title}>📢 {pageContent?.title?.[language] || (language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications')}</h1>
                <p className={styles.description}>
                  {pageContent?.description?.[language] || (language === 'ta' 
                    ? 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், செய்திகள் மற்றும் முக்கியமான தகவல்களுடன் புதுப்பித்துக் கொள்ளுங்கள்.'
                    : 'Stay updated with the latest announcements, news, and important information from the Tamil Language Society.'
                  )}
                </p>
              </div>

              {/* Statistics Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={`${styles.statNumber} ${styles.totalNotifications}`}>{stats.total}</div>
                  <div className={styles.statLabel}>{pageContent?.stats?.totalNotifications?.[language] || (language === 'ta' ? 'மொத்த அறிவிப்புகள்' : 'Total Notifications')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statNumber} ${styles.unreadCount}`}>{stats.unread}</div>
                  <div className={styles.statLabel}>{pageContent?.stats?.unread?.[language] || (language === 'ta' ? 'படிக்காதவை' : 'Unread')}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statNumber} ${styles.realTimeIcon}`}>📱</div>
                  <div className={styles.statLabel}>{pageContent?.stats?.realTimeUpdates?.[language] || (language === 'ta' ? 'நேரடி புதுப்பிப்புகள்' : 'Real-time Updates')}</div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className={styles.filtersCard}>
                <div className={styles.filtersContainer}>
                  <div className={styles.filtersGroup}>
                    {['all', 'unread', 'urgent', 'high', 'medium', 'low', 'announcement', 'news', 'event', 'update', 'info', 'warning', 'success', 'error'].map((filterType) => (
                      <button 
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={`${styles.filterBtn} ${filter === filterType ? styles.active : ''}`}
                      >
                        {language === 'ta' ? {
                          all: 'அனைத்தும்',
                          unread: 'படிக்காதவை',
                          urgent: 'அவசரம்',
                          high: 'உயர் முன்னுரிமை',
                          medium: 'நடுத்தர முன்னுரிமை',
                          low: 'குறைந்த முன்னுரிமை',
                          announcement: 'அறிவிப்புகள்',
                          news: 'செய்திகள்',
                          event: 'நிகழ்வுகள்',
                          update: 'புதுப்பிப்புகள்',
                          info: 'தகவல்',
                          warning: 'எச்சரிக்கைகள்',
                          success: 'வெற்றி',
                          error: 'பிழைகள்'
                        }[filterType] : {
                          all: 'All',
                          unread: 'Unread',
                          urgent: 'Urgent',
                          high: 'High Priority',
                          medium: 'Medium Priority',
                          low: 'Low Priority',
                          announcement: 'Announcements',
                          news: 'News',
                          event: 'Events',
                          update: 'Updates',
                          info: 'Info',
                          warning: 'Warnings',
                          success: 'Success',
                          error: 'Errors'
                        }[filterType]}
                      </button>
                    ))}
                  </div>
                  <div className={styles.actionsGroup}>
                    <button 
                      onClick={markAllAsRead}
                      className={`${styles.actionBtn} ${styles.markAllReadBtn}`}
                      disabled={stats.unread === 0}
                    >
                      {language === 'ta' ? 'அனைத்தையும் படித்ததாக குறிக்கவும்' : 'Mark All Read'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {/* Notifications Container */}
              <div className={styles.notificationsContainer}>
                <div className={styles.notificationsHeader}>
                  <h2 className={styles.notificationsTitle}>{language === 'ta' ? 'உங்கள் அறிவிப்புகள்' : 'Your Notifications'}</h2>
                  <p className={styles.notificationsSubtitle}>{language === 'ta' ? 'படித்ததாக குறிக்க எந்த அறிவிப்பையும் கிளிக் செய்யவும்' : 'Click on any notification to mark it as read'}</p>
                </div>
                
                <div className={styles.notificationsList}>
                  {loading ? (
                    <div className={styles.loadingMessage}>{language === 'ta' ? 'அறிவிப்புகள் ஏற்றப்படுகின்றன...' : 'Loading notifications...'}</div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>📭</div>
                      <h3 className={styles.emptyTitle}>{language === 'ta' ? 'அறிவிப்புகள் எதுவும் கிடைக்கவில்லை' : 'No notifications found'}</h3>
                      <p className={styles.emptyDescription}>{language === 'ta' ? 'நீங்கள் அனைத்தையும் பார்த்துவிட்டீர்கள்! புதிய புதுப்பிப்புகளுக்கு பின்னர் சரிபார்க்கவும்.' : 'You\'re all caught up! Check back later for new updates.'}</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`${styles.notificationItem} ${notification.isRead ? styles.read : styles.unread}`}
                        onClick={() => handleNotificationClick(notification)}
                        style={{ borderLeftColor: getPriorityColor(notification.priority) }}
                      >
                        <div className={styles.notificationContent}>
                          <div className={styles.notificationIcon}>
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className={styles.notificationBody}>
                            <div className={styles.notificationHeader}>
                              <h4 className={styles.notificationTitle}>
                                {language === 'ta' ? (notification.title?.ta || '') : (notification.title?.en || '')}
                              </h4>
                              <div className={styles.notificationMeta}>
                                <span className={styles.priorityBadge} style={{ backgroundColor: getPriorityColor(notification.priority) }}>
                                  {notification.priority.toUpperCase()}
                                </span>
                                <span className={styles.notificationTime}>
                                  {formatTimeAgo(notification.startAt)}
                                </span>
                              </div>
                            </div>
                            <p className={styles.notificationMessage}>
                              {language === 'ta' ? (notification.message.ta || '') : (notification.message.en || '')}
                            </p>
                            {notification.actionText && notification.actionUrl && (
                              <div className={styles.notificationActions}>
                                <button className={styles.notificationActionBtn}>
                                  {language === 'ta' ? (notification.actionText.ta || '') : (notification.actionText.en || '')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Settings Panel */}
              <div className={styles.settingsPanel}>
                <h3 className={styles.settingsTitle}>🔔 {language === 'ta' ? 'அறிவிப்பு விருப்பத்தேர்வுகள்' : 'Notification Preferences'}</h3>
                <div className={styles.settingsGrid}>
                  <div>
                    <h4 className={styles.settingsSubtitle}>{language === 'ta' ? 'மின்னஞ்சல் அறிவிப்புகள்' : 'Email Notifications'}</h4>
                    <div className={styles.settingsOptions}>
                      <label className={styles.settingsOption}>
                        <input 
                          type="checkbox" 
                          checked={preferences.email.announcements}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, announcements: e.target.checked }
                          }))}
                          className={styles.checkbox} 
                        />
                        <span>{language === 'ta' ? 'முக்கியமான அறிவிப்புகள்' : 'Important announcements'}</span>
                      </label>
                      <label className={styles.settingsOption}>
                        <input 
                          type="checkbox" 
                          checked={preferences.email.newContent}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, newContent: e.target.checked }
                          }))}
                          className={styles.checkbox} 
                        />
                        <span>{language === 'ta' ? 'புதிய புத்தகங்கள் மற்றும் உள்ளடக்கம்' : 'New books and content'}</span>
                      </label>
                      <label className={styles.settingsOption}>
                        <input 
                          type="checkbox" 
                          checked={preferences.email.weekly}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, weekly: e.target.checked }
                          }))}
                          className={styles.checkbox} 
                        />
                        <span>{language === 'ta' ? 'வாராந்திர சுருக்கம்' : 'Weekly digest'}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h4 className={styles.settingsSubtitle}>{language === 'ta' ? 'புஷ் அறிவிப்புகள்' : 'Push Notifications'}</h4>
                    <div className={styles.settingsOptions}>
                      <label className={styles.settingsOption}>
                        <input 
                          type="checkbox" 
                          checked={preferences.push.breaking}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, breaking: e.target.checked }
                          }))}
                          className={styles.checkbox} 
                        />
                        <span>{language === 'ta' ? 'முக்கிய செய்திகள்' : 'Breaking news'}</span>
                      </label>
                      <label className={styles.settingsOption}>
                        <input 
                          type="checkbox" 
                          checked={preferences.push.newContent}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, newContent: e.target.checked }
                          }))}
                          className={styles.checkbox} 
                        />
                        <span>{language === 'ta' ? 'புதிய உள்ளடக்க எச்சரிக்கைகள்' : 'New content alerts'}</span>
                      </label>
                      <label className={styles.settingsOption}>
                        <input 
                          type="checkbox" 
                          checked={preferences.push.updates}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, updates: e.target.checked }
                          }))}
                          className={styles.checkbox} 
                        />
                        <span>{language === 'ta' ? 'கணினி புதுப்பிப்புகள்' : 'System updates'}</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className={styles.languageSection}>
                  <h4 className={styles.settingsSubtitle}>{language === 'ta' ? 'மொழி விருப்பம்' : 'Language Preference'}</h4>
                  <div className={styles.languageOptions}>
                    <label className={styles.settingsOption}>
                      <input 
                        type="radio" 
                        name="language" 
                        value="en" 
                        checked={preferences.language === 'en'}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as 'en' | 'ta' | 'both' }))}
                        className={styles.radio} 
                      />
                      <span>English</span>
                    </label>
                    <label className={styles.settingsOption}>
                      <input 
                        type="radio" 
                        name="language" 
                        value="ta" 
                        checked={preferences.language === 'ta'}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as 'en' | 'ta' | 'both' }))}
                        className={styles.radio} 
                      />
                      <span>தமிழ்</span>
                    </label>
                    <label className={styles.settingsOption}>
                      <input 
                        type="radio" 
                        name="language" 
                        value="both" 
                        checked={preferences.language === 'both'}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as 'en' | 'ta' | 'both' }))}
                        className={styles.radio} 
                      />
                      <span>{language === 'ta' ? 'இரண்டும்' : 'Both'}</span>
                    </label>
                  </div>
                </div>
                <button 
                  onClick={savePreferences}
                  disabled={savingPreferences}
                  className={styles.saveButton}
                >
                  💾 {savingPreferences 
                    ? (language === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...') 
                    : (language === 'ta' ? 'விருப்பத்தேர்வுகளை சேமிக்கவும்' : 'Save Preferences')
                  }
                </button>
              </div>
            </div>
          </div>
        </main>
        {components.filter(c => c.type === 'footer').map((component, index) => (
          <DynamicComponent key={index} component={component} />
        ))}
      </>
    )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps<NotificationsPageProps> = async () => {
  try {
    const pageContent = await getPageContent('notifications');
    const seoData = await getPageSEO('notifications');

    return {
      props: {
        pageContent: pageContent || {
          title: {
            en: 'Notifications',
            ta: 'அறிவிப்புகள்'
          },
          description: {
            en: 'Stay updated with the latest announcements, news, and important information from the Tamil Language Society.',
            ta: 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், செய்திகள் மற்றும் முக்கியமான தகவல்களுடன் புதுப்பித்துக் கொள்ளுங்கள்.'
          },
          stats: {
            totalNotifications: {
              en: 'Total Notifications',
              ta: 'மொத்த அறிவிப்புகள்'
            },
            unread: {
              en: 'Unread',
              ta: 'படிக்காதவை'
            },
            realTimeUpdates: {
              en: 'Real-time Updates',
              ta: 'நேரடி புதுப்பிப்புகள்'
            }
          }
        },
        seoData: seoData || {
          title: {
            en: 'Notifications - Tamil Language Society',
            ta: 'அறிவிப்புகள் - தமிழ் மொழி சங்கம்'
          },
          description: {
            en: 'Stay informed with the latest notifications, announcements, and updates from the Tamil Language Society.',
            ta: 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், அறிவிப்புகள் மற்றும் புதுப்பிப்புகளுடன் தகவலறிந்து இருங்கள்.'
          }
        }
      }
    };
  } catch (error) {
    console.error('Error fetching notifications page content:', error);
    return {
      props: {
        pageContent: {
          title: {
            en: 'Notifications',
            ta: 'அறிவிப்புகள்'
          },
          description: {
            en: 'Stay updated with the latest announcements, news, and important information from the Tamil Language Society.',
            ta: 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், செய்திகள் மற்றும் முக்கியமான தகவல்களுடன் புதுப்பித்துக் கொள்ளுங்கள்.'
          },
          stats: {
            totalNotifications: {
              en: 'Total Notifications',
              ta: 'மொத்த அறிவிப்புகள்'
            },
            unread: {
              en: 'Unread',
              ta: 'படிக்காதவை'
            },
            realTimeUpdates: {
              en: 'Real-time Updates',
              ta: 'நேரடி புதுப்பிப்புகள்'
            }
          }
        },
        seoData: {
          title: {
            en: 'Notifications - Tamil Language Society',
            ta: 'அறிவிப்புகள் - தமிழ் மொழி சங்கம்'
          },
          description: {
            en: 'Stay informed with the latest notifications, announcements, and updates from the Tamil Language Society.',
            ta: 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், அறிவிப்புகள் மற்றும் புதுப்பிப்புகளுடன் தகவலறிந்து இருங்கள்.'
          }
        }
      }
    };
  }
};