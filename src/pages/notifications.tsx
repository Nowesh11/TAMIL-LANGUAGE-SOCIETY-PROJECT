import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { toast } from 'react-hot-toast';
import DynamicComponent from '../components/DynamicComponent';
import { useLanguage } from '../hooks/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { getPageContent, getPageSEO } from '../lib/getPageContent';

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
          <div className="min-h-screen flex items-center justify-center aurora-bg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <>
            {components.map((component, index) => (
              <DynamicComponent key={index} component={component} />
            ))}
            <main className="flex items-center justify-center min-h-[60vh] aurora-bg">
              <div className="text-center card-morphism p-10 rounded-3xl border border-white/10">
                <h1 className="text-2xl font-bold mb-4 text-white">
                  {language === 'ta' ? 'உள்நுழைவு தேவை' : 'Login Required'}
                </h1>
                <p className="text-gray-400 mb-6">
                  {language === 'ta' 
                    ? 'அறிவிப்புகளைப் பார்க்க தயவுசெய்து உள்நுழையவும்'
                    : 'Please log in to view notifications'
                  }
                </p>
                <button 
                  onClick={() => router.push('/login')}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
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
        <div className="min-h-screen flex items-center justify-center aurora-bg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <>
          {components.filter(c => ['seo', 'navbar'].includes(c.type)).map((component, index) => (
            <DynamicComponent key={index} component={component} />
          ))}
          <main className="aurora-bg min-h-screen py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-3 text-white drop-shadow-lg">📢 {pageContent?.title?.[language] || (language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications')}</h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto drop-shadow-md">
                  {pageContent?.description?.[language] || (language === 'ta' 
                    ? 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், செய்திகள் மற்றும் முக்கியமான தகவல்களுடன் புதுப்பித்துக் கொள்ளுங்கள்.'
                    : 'Stay updated with the latest announcements, news, and important information from the Tamil Language Society.'
                  )}
                </p>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-morphism p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-primary mb-2">{stats.total}</div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{pageContent?.stats?.totalNotifications?.[language] || (language === 'ta' ? 'மொத்த அறிவிப்புகள்' : 'Total Notifications')}</div>
                </div>
                <div className="card-morphism p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl font-bold text-amber-400 mb-2">{stats.unread}</div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{pageContent?.stats?.unread?.[language] || (language === 'ta' ? 'படிக்காதவை' : 'Unread')}</div>
                </div>
                <div className="card-morphism p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{pageContent?.stats?.realTimeUpdates?.[language] || (language === 'ta' ? 'நேரடி புதுப்பிப்புகள்' : 'Real-time Updates')}</div>
                </div>
              </div>

              {/* Filter Controls */}
              <div className="card-morphism p-6 rounded-2xl border border-white/10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {['all', 'unread', 'urgent', 'high', 'medium', 'low', 'announcement', 'news', 'event', 'update', 'info', 'warning', 'success', 'error'].map((filterType) => (
                      <button 
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${filter === filterType ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'}`}
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
                  <div className="flex-shrink-0">
                    <button 
                      onClick={markAllAsRead}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={stats.unread === 0}
                    >
                      {language === 'ta' ? 'அனைத்தையும் படித்ததாக குறிக்கவும்' : 'Mark All Read'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl text-center">
                  {error}
                </div>
              )}

              {/* Notifications Container */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">{language === 'ta' ? 'உங்கள் அறிவிப்புகள்' : 'Your Notifications'}</h2>
                  <p className="text-gray-400 text-sm">{language === 'ta' ? 'படித்ததாக குறிக்க எந்த அறிவிப்பையும் கிளிக் செய்யவும்' : 'Click on any notification to mark it as read'}</p>
                </div>
                
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12 text-gray-400">{language === 'ta' ? 'அறிவிப்புகள் ஏற்றப்படுகின்றன...' : 'Loading notifications...'}</div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="card-morphism p-12 rounded-3xl border border-white/10 text-center">
                      <div className="text-6xl mb-4">📭</div>
                      <h3 className="text-xl font-bold text-white mb-2">{language === 'ta' ? 'அறிவிப்புகள் எதுவும் கிடைக்கவில்லை' : 'No notifications found'}</h3>
                      <p className="text-gray-400">{language === 'ta' ? 'நீங்கள் அனைத்தையும் பார்த்துவிட்டீர்கள்! புதிய புதுப்பிப்புகளுக்கு பின்னர் சரிபார்க்கவும்.' : 'You\'re all caught up! Check back later for new updates.'}</p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`card-morphism p-6 rounded-2xl border border-white/10 transition-all duration-300 cursor-pointer relative overflow-hidden group ${notification.isRead ? 'opacity-80 hover:opacity-100' : 'bg-white/5 border-primary/30 shadow-lg shadow-primary/5'}`}
                        onClick={() => handleNotificationClick(notification)}
                        style={{ borderLeftWidth: '4px', borderLeftColor: getPriorityColor(notification.priority) }}
                      >
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0 border border-white/10">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                              <h4 className={`text-lg font-bold ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                                {language === 'ta' ? (notification.title?.ta || '') : (notification.title?.en || '')}
                              </h4>
                              <div className="flex items-center gap-3">
                                <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase text-white" style={{ backgroundColor: getPriorityColor(notification.priority) }}>
                                  {notification.priority.toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                  {formatTimeAgo(notification.startAt)}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-4">
                              {language === 'ta' ? (notification.message.ta || '') : (notification.message.en || '')}
                            </p>
                            {notification.actionText && notification.actionUrl && (
                              <div className="flex justify-end">
                                <button className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg text-sm font-bold transition-all">
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
              <div className="card-morphism p-8 rounded-3xl border border-white/10 mt-12">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span>🔔</span> {language === 'ta' ? 'அறிவிப்பு விருப்பத்தேர்வுகள்' : 'Notification Preferences'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider">{language === 'ta' ? 'மின்னஞ்சல் அறிவிப்புகள்' : 'Email Notifications'}</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={preferences.email.announcements}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, announcements: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{language === 'ta' ? 'முக்கியமான அறிவிப்புகள்' : 'Important announcements'}</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={preferences.email.newContent}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, newContent: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{language === 'ta' ? 'புதிய புத்தகங்கள் மற்றும் உள்ளடக்கம்' : 'New books and content'}</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={preferences.email.weekly}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            email: { ...prev.email, weekly: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{language === 'ta' ? 'வாராந்திர சுருக்கம்' : 'Weekly digest'}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider">{language === 'ta' ? 'புஷ் அறிவிப்புகள்' : 'Push Notifications'}</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={preferences.push.breaking}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, breaking: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{language === 'ta' ? 'முக்கிய செய்திகள்' : 'Breaking news'}</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={preferences.push.newContent}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, newContent: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{language === 'ta' ? 'புதிய உள்ளடக்க எச்சரிக்கைகள்' : 'New content alerts'}</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={preferences.push.updates}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            push: { ...prev.push, updates: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{language === 'ta' ? 'கணினி புதுப்பிப்புகள்' : 'System updates'}</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary mb-4 text-sm uppercase tracking-wider">{language === 'ta' ? 'மொழி விருப்பம்' : 'Language Preference'}</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="language" 
                          value="en" 
                          checked={preferences.language === 'en'}
                          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as 'en' | 'ta' | 'both' }))}
                          className="w-5 h-5 border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">English</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="language" 
                          value="ta" 
                          checked={preferences.language === 'ta'}
                          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as 'en' | 'ta' | 'both' }))}
                          className="w-5 h-5 border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">தமிழ்</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input 
                          type="radio" 
                          name="language" 
                          value="both" 
                          checked={preferences.language === 'both'}
                          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as 'en' | 'ta' | 'both' }))}
                          className="w-5 h-5 border-gray-600 bg-gray-700 text-primary focus:ring-primary/50" 
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors">{language === 'ta' ? 'இரண்டும்' : 'Both'}</span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={savePreferences}
                    disabled={savingPreferences}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all flex items-center gap-2"
                  >
                    <span>💾</span>
                    {savingPreferences 
                      ? (language === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...') 
                      : (language === 'ta' ? 'விருப்பத்தேர்வுகளை சேமிக்கவும்' : 'Save Preferences')
                    }
                  </button>
                </div>
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