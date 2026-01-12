'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  FiSend, 
  FiSearch, 
  FiMoreVertical,
  FiPaperclip,
  FiSmile,
  FiCheck,
  FiClock,
  FiArrowLeft,
  FiLock,
  FiImage,
  FiUser
} from 'react-icons/fi';
import { io } from 'socket.io-client';
import '@/styles/admin/chat.css';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isOwn: boolean;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

const ChatSystem = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [lastMsgMap, setLastMsgMap] = useState<Record<string, { text: string; time?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Chat State
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Initial Load and Socket Setup
  useEffect(() => {
    // Initialize socket
    fetch('/api/socket/init')
      .then((res) => {
        if (res.ok) {
           socketRef.current = io({ path: '/api/socket/io' });

           socketRef.current.on('connect', () => {
             console.log('Connected to chat server');
             socketRef.current.emit('join-room', 'admin');
             
             // Also join the room for this specific admin user ID if available
             // This ensures we receive messages sent specifically to our ID (which the user chat does)
             const token = localStorage.getItem('accessToken');
             if (token) {
               // We need to decode the token or fetch /api/auth/me to get ID
               // For now, let's fetch 'me'
               fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
                 .then(r => r.json())
                 .then(d => {
                   if (d.success && d.user?._id) {
                     socketRef.current.emit('join-room', d.user._id);
                   }
                 })
                 .catch(e => console.error('Failed to join admin ID room', e));
             }
           });
           
           socketRef.current.on('connect_error', (err: any) => {
             console.warn('Socket connect error:', err);
           });

           socketRef.current.on('receive-message', (message: any) => {
             // If chat is open with the sender, append message
             if (activeUser && (message.senderId === activeUser.id || message.recipientId === activeUser.id)) {
                setMessages(prev => {
                  if (prev.some(m => m.id === message.id)) return prev;
                  
                  const newMsg: Message = {
                    id: message._id || message.id,
                    senderId: message.senderId,
                    senderName: message.senderId === 'admin' ? 'Admin' : 'User',
                    content: message.message || message.content,
                    timestamp: message.timestamp,
                    type: 'text',
                    status: 'delivered',
                    isOwn: String(message.senderId) !== String(activeUser.id)
                  };
                  return [...prev, newMsg];
                });
                scrollToBottom();
             }
             // Refresh user list to update last message/unread count
             fetchUsers();
           });
        }
      })
      .catch(err => console.warn('Socket init failed', err));

    const controller = new AbortController();
    fetchUsers(controller.signal);
    
    return () => { 
      if (!controller.signal.aborted) { try { controller.abort(); } catch {} } 
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [activeUser]);

  // Polling for User List
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Polling for Active Chat
  // DISABLED polling for messages to prevent overwriting socket updates
  // Only rely on socket events and manual refresh/selection
  /*
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeUser) {
      interval = setInterval(() => {
        fetchMessages(activeUser.id);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeUser]);
  */

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/users?limit=200', { signal, headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } })
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/json')) return;
      
      const data = await res.json()
      if (data?.success && Array.isArray(data.data)) {
        const mapped: User[] = data.data.map((u: any) => ({
          id: String(u.id),
          name: u.name || '',
          avatar: u.avatar || '',
          isOnline: !!u.isOnline,
          lastSeen: u.lastSeen
        }))
        setUsers(mapped)
      }

      const convRes = await fetch('/api/admin/chat/conversations', { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, signal })
      const convData = await convRes.json().catch(() => ({}))
      if (convData?.success && Array.isArray(convData.data)) {
        const m: Record<string, number> = {}
        const lm: Record<string, { text: string; time?: string }> = {}
        convData.data.forEach((c: any) => { m[String(c.otherUserId)] = Number(c.unreadCount || 0) })
        convData.data.forEach((c: any) => { lm[String(c.otherUserId)] = { text: String(c.lastMessage || ''), time: c.lastMessageTime } })
        setUnreadMap(m)
        setLastMsgMap(lm)
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/messages?userId=${encodeURIComponent(userId)}&limit=200`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return;
      const data = await res.json();
      if (data?.success) {
        const mapped: Message[] = (data.messages || []).map((m: any) => ({
          id: m._id || m.id,
          senderId: m.senderId,
          senderName: String(m.senderId) === String(userId) ? (users.find(u => u.id === userId)?.name || 'User') : 'Admin',
          content: m.message || m.content,
          timestamp: m.timestamp,
          type: 'text',
          status: 'delivered',
          isOwn: String(m.senderId) !== String(userId)
        }))
        setMessages(mapped);
      }
    } catch (e) {
      console.error('Fetch messages failed', e);
    }
  };

  const selectUser = async (u: User) => {
    setActiveUser(u);
    setMessages([]); // Clear previous chat instantly
    await fetchMessages(u.id);
    
    // Mark read
    await fetch('/api/admin/chat/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ userId: u.id }) })
    setUnreadMap(prev => ({ ...prev, [u.id]: 0 }))
    setTimeout(scrollToBottom, 100);
  };

  const sendMessage = async () => {
    if (!activeUser || !newMessage.trim()) return;
    
    const temp: Message = {
      id: Date.now().toString(),
      senderId: 'admin',
      senderName: 'Admin',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sending',
      isOwn: true
    };
    
    setMessages(prev => [...prev, temp]);
    setNewMessage('');
    
    try {
      const res = await fetch('/api/admin/chat/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ userId: activeUser.id, message: temp.content }) });
      const data = await res.json();
      if (data?.success) {
        setMessages(prev => prev.map(m => m.id === temp.id ? { ...m, id: data.message._id, status: 'sent' } : m));
        
        if (socketRef.current) {
          socketRef.current.emit('send-message', {
            ...data.message,
            recipientId: activeUser.id
          });
        }
        fetchUsers(); // Update sidebar last message
      }
    } catch {
      console.error('Send failed');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Sort by last message time if available
    const timeA = lastMsgMap[a.id]?.time ? new Date(lastMsgMap[a.id].time!).getTime() : 0;
    const timeB = lastMsgMap[b.id]?.time ? new Date(lastMsgMap[b.id].time!).getTime() : 0;
    return timeB - timeA;
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday 
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : date.toLocaleDateString();
  };

  return (
    <AdminLayout title="Messages" subtitle="Connect with your community">
      <div className="chat-layout">
        
        {/* LEFT SIDEBAR - User List */}
        <div className={`chat-sidebar ${activeUser ? 'hidden md:flex' : 'flex'}`}>
          {/* Sidebar Header */}
          <div className="sidebar-header">
            <div className="flex items-center gap-3">
              <div className="user-avatar-container">
                <div className="avatar-placeholder">A</div>
                <div className="status-indicator"></div>
              </div>
              <span className="font-bold text-gray-800 text-lg">Chats</span>
            </div>
            <div className="flex gap-3 text-gray-500">
               <FiMoreVertical className="cursor-pointer hover:text-indigo-600 transition-colors" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* User List */}
          <div className="user-list">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm">Loading conversations...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <FiUser size={32} className="mb-2 opacity-50" />
                <span className="text-sm">No chats found</span>
              </div>
            ) : (
              filteredUsers.map(u => {
                const lastMsg = lastMsgMap[u.id];
                const unread = unreadMap[u.id] || 0;
                
                return (
                  <div
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className={`user-item ${activeUser?.id === u.id ? 'active' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder" style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', color: '#4f46e5' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {u.isOnline && (
                        <div className="status-indicator"></div>
                      )}
                    </div>
                    
                    <div className="user-info">
                      <div className="user-header">
                        <h3 className="user-name">{u.name}</h3>
                        {lastMsg?.time && (
                          <span className={`message-time ${unread > 0 ? 'text-indigo-600 font-bold' : ''}`}>
                            {formatTime(lastMsg.time)}
                          </span>
                        )}
                      </div>
                      <div className="last-message">
                        <p className={`message-preview ${unread > 0 ? 'text-gray-900 font-medium' : ''}`}>
                          {lastMsg?.text || <span className="italic text-gray-400">Click to start chatting</span>}
                        </p>
                        {unread > 0 && (
                          <span className="unread-badge">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT SIDE - Chat Area */}
        {activeUser ? (
          <div className={`chat-area ${activeUser ? 'flex' : 'hidden md:flex'}`}>
            
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div onClick={() => setActiveUser(null)} className="md:hidden back-button">
                  <FiArrowLeft size={20} />
                </div>
                <div className="relative cursor-pointer">
                  {activeUser.avatar ? (
                    <img src={activeUser.avatar} alt={activeUser.name} className="avatar-image" />
                  ) : (
                    <div className="avatar-placeholder">
                      {activeUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="chat-user-details cursor-pointer">
                  <h3>{activeUser.name}</h3>
                  <p className="chat-user-status">
                    {activeUser.isOnline ? 'Online' : (activeUser.lastSeen ? `Last seen ${new Date(activeUser.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Offline')}
                  </p>
                </div>
              </div>
              <div className="chat-actions">
                <FiSearch className="action-icon" size={20} />
                <FiMoreVertical className="action-icon" size={20} />
              </div>
            </div>

            {/* Messages Area */}
            <div className="messages-container">
              {messages.map((msg, index) => {
                const showDate = index === 0 || new Date(msg.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="date-divider">
                        <span>
                          {new Date(msg.timestamp).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                    
                    <div className={`message-wrapper ${msg.isOwn ? 'own' : ''}`}>
                      <div className={`message-bubble ${msg.isOwn ? 'own' : 'other'}`}>
                        {msg.content}
                        <div className="message-meta">
                          <span className="message-time-text">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.isOwn && (
                            <span className={msg.status === 'read' ? 'text-blue-200' : 'text-indigo-200'}>
                              {msg.status === 'read' ? <span className="flex"><FiCheck size={12}/><FiCheck size={12} style={{ marginLeft: '-7px' }}/></span> :
                               msg.status === 'delivered' ? <span className="flex"><FiCheck size={12}/><FiCheck size={12} style={{ marginLeft: '-7px' }}/></span> :
                               <FiCheck size={12} />
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area">
              
              <div className="input-field-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="chat-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
              </div>

              <button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="send-button"
              >
                <FiSend size={18} className={newMessage.trim() ? "ml-1" : ""} />
              </button>
            </div>

          </div>
        ) : (
          /* Empty State (Right Side) */
          <div className="empty-state hidden md:flex">
            <div className="empty-illustration">
               <FiSend className="transform rotate-[-15deg] translate-x-1 translate-y-1" />
            </div>
            <h1 className="empty-title">Welcome to Admin Chat</h1>
            <p className="empty-text">
              Select a conversation from the sidebar to start messaging. 
              You can connect with users in real-time.
            </p>
            <div className="secure-badge">
              <FiLock size={12} /> End-to-end encrypted
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default ChatSystem;
