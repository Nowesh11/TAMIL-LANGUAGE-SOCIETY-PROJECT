'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import NavBar from '@/components/NavBar';
import { FiBell, FiCheck, FiClock, FiInfo, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Notification {
  _id: string;
  title: { en: string; ta: string };
  message: { en: string; ta: string };
  type: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  actionText?: { en: string; ta: string };
}

export default function UserNotificationsPage() {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=50', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [accessToken]);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ action: 'markRead', notificationIds: [id] })
      });
      
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ action: 'markAllRead' })
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.isRead);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <FiCheck className="text-green-500" />;
      case 'warning': return <FiAlertCircle className="text-yellow-500" />;
      case 'error': return <FiAlertCircle className="text-red-500" />;
      default: return <FiInfo className="text-blue-500" />;
    }
  };

  const getLanguageContent = (obj: { en: string; ta: string } | undefined) => {
    // Simple fallback logic, ideally use a language context
    return obj?.en || obj?.ta || '';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar page="notifications" />
      
      <div className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FiBell className="text-indigo-600" />
                Announcements
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Stay updated with your latest alerts
              </p>
            </div>
            <div className="flex gap-2">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
              </select>
              <button 
                onClick={markAllRead}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                Mark all read
              </button>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading notifications...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiBell className="w-8 h-8 text-gray-300" />
                </div>
                <p>No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`p-6 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                  onClick={() => !notification.isRead && markAsRead(notification._id)}
                >
                  <div className="flex gap-4">
                    <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      notification.type === 'success' ? 'bg-green-100' :
                      notification.type === 'warning' ? 'bg-yellow-100' :
                      notification.type === 'error' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-base font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {getLanguageContent(notification.title)}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1 text-sm leading-relaxed">
                        {getLanguageContent(notification.message)}
                      </p>
                      
                      {notification.actionUrl && (
                        <div className="mt-3">
                          <Link 
                            href={notification.actionUrl}
                            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            {getLanguageContent(notification.actionText) || 'View Details'} →
                          </Link>
                        </div>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0" title="Unread" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}