'use client';

import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { safeFetchJson } from '../lib/safeFetch';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';
import { FiSend, FiX, FiMessageSquare } from 'react-icons/fi';
import '@/styles/components/ChatModal.css';

type ChatMessage = {
  _id: string;
  senderId: string;
  recipientId: string;
  message: string;
  messageType: 'text' | 'image';
  timestamp: string | Date;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
};

export default function ChatModal({ open, onClose, logo }: { open: boolean; onClose: () => void; logo?: any }) {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [adminName, setAdminName] = useState<any>('Admin Support');
  const [adminId, setAdminId] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Helper to get display name safely
  const getDisplayName = (name: any) => {
    if (!name) return 'Admin Support';
    if (typeof name === 'string') return name;
    if (typeof name === 'object') return name.en || name.ta || 'Admin Support';
    return 'Admin Support';
  };
  
  const displayName = getDisplayName(adminName);

  // Helper to resolve logo URL
  const resolveLogoUrl = (src: string) => {
    try {
      if (!src) return '';
      if (src.startsWith('/api/')) return src;
      if (src.startsWith('http')) return src;
      const base = typeof window !== 'undefined' ? window.location.origin : '';
      const p = src.replace(/^https?:\/\/[^/]+/, '').replace(/^[/]+/, '');
      if (p.toLowerCase().startsWith('uploads/')) {
        return `${base}/api/uploads/image?p=${encodeURIComponent(p)}`;
      }
      return src;
    } catch {
      return src;
    }
  };

  const logoSrc = logo?.image?.src ? resolveLogoUrl(logo.image.src) : null;

  // Initialize Socket & Load History
  useEffect(() => {
    if (!open || !user) return;
    let isMounted = true;

    // Load initial history
    const loadHistory = async () => {
      const headers: Record<string, string> = {};
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await safeFetchJson('/api/chat?limit=50', { headers });
      if (res?.success && isMounted) {
        setAdminName(res.admin?.name || 'Admin Support');
        setAdminId(String(res.admin?.id || ''));
        setMessages(prev => {
          const fetched = res.messages || [];
          const fetchedIds = new Set(fetched.map((m: any) => m._id));
          
          // Keep messages from 'prev' that are NOT in 'fetched'
          // This preserves pending messages and new socket messages received during fetch
          const uniquePrev = prev.filter(m => !fetchedIds.has(m._id));
          
          // Combine and sort
          return [...fetched, ...uniquePrev].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    };
    loadHistory();

    // Connect Socket
    // We fetch the init route to ensure the socket server is ready
    fetch('/api/socket/init')
      .then((res) => {
        if (res.ok && isMounted) {
           // Use undefined path to fallback to default or let the socket client handle path construction
           // The backend is served at the same origin, so we don't need full URL
           // BUT we must match the path configured in the server
           socketRef.current = io({ 
             path: '/api/socket/io',
             addTrailingSlash: false,
             transports: ['polling', 'websocket'], // Explicitly allow polling first to avoid 400 issues
           });

           socketRef.current.on('connect', () => {
             console.log('Chat connected');
             if (isMounted) setSocketConnected(true);
             // User joins their own room to receive messages
             if (user) {
                  const userId = (user as any)._id || (user as any).id;
                  console.log('Joining room:', userId);
                  socketRef.current.emit('join-room', userId);
             }
           });

           socketRef.current.on('receive-message', (message: any) => {
             if (!isMounted) return;
             console.log('Received message:', message);
             setMessages(prev => {
               // Avoid duplicates
               if (prev.some(m => m._id === message._id || m._id === message.id)) return prev;
               
               return [...prev, {
                 _id: message._id || message.id || Date.now().toString(),
                 senderId: message.senderId,
                 recipientId: message.recipientId,
                 message: message.message || message.content,
                 messageType: message.messageType || 'text',
                 timestamp: message.timestamp || new Date(),
                 status: 'read'
               }];
             });
           });

           socketRef.current.on('disconnect', () => {
             console.log('Chat disconnected');
             if (isMounted) setSocketConnected(false);
           });
        }
      })
      .catch(err => console.error('Socket init failed', err));

    return () => {
      isMounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, (user as any)?._id || (user as any)?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      // Use scrollTo for better compatibility and to avoid potential clientHeight issues if element isn't fully rendered
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, open]); // Add open dependency to scroll when modal opens

  const send = async () => {
    if (!text.trim() || !user) return;

    const tempId = Date.now().toString();
    const newMsg: ChatMessage = {
      _id: tempId,
      senderId: (user as any)._id || (user as any).id,
      recipientId: 'admin', // Backend handles finding admin
      message: text,
      messageType: 'text',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, newMsg]);
    setText('');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await safeFetchJson('/api/chat', { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ message: newMsg.message, messageType: 'text' }) 
      });

      if (res?.success && res.message) {
        // Update temp message with real one
        setMessages(prev => prev.map(m => m._id === tempId ? { ...res.message, status: 'sent' } : m));
        
        // Emit to socket for admin to see instantly if they are online
        if (socketRef.current) {
          socketRef.current.emit('send-message', {
             ...res.message,
             recipientId: res.message.recipientId // Should be admin ID from backend response
          });
        }
      } else {
        console.error('Send failed response:', res);
        setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'sent' } : m)); // Keep as sent or mark failed
      }
    } catch (e) {
      console.error('Send failed', e);
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'sent' } : m)); // Keep as sent locally or error
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="" size="md" dismissOnBackdrop={false}>
      {/* Modern Chat Layout using separate CSS file */}
      <div className="chat-modal-container">
        
        {/* Header */}
        <div className="chat-modal-header">
          <div className="chat-header-info">
            <div className="chat-avatar-wrapper">
              <div className="chat-avatar">
                 {displayName.charAt(0)}
              </div>
              {socketConnected && <span className="chat-status-dot pulse"></span>}
            </div>
            <div className="chat-user-details">
              <h3>{displayName}</h3>
              <p className="chat-status-text">
                 {socketConnected ? (
                   <>
                     <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac' }}></span>
                     Online
                   </>
                 ) : 'Connecting...'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="chat-close-btn">
            <FiX size={20} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="chat-modal-body" ref={listRef}>
          {loading ? (
            <div className="chat-loading">
               <div className="chat-spinner"></div>
               <p>Loading conversation...</p>
            </div>
          ) : !user ? (
            <div className="chat-login-prompt">
              <div className="chat-login-icon">
                 <FiMessageSquare size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Join the Conversation</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                Sign in to chat directly with our support team and get instant assistance.
              </p>
              <button 
                onClick={() => window.location.href = '/login?redirect=/contacts'} 
                className="chat-login-btn"
              >
                Sign In to Chat
              </button>
            </div>
          ) : messages.length === 0 ? (
             <div className="chat-empty">
                <p style={{ margin: 0, fontWeight: 500, color: '#1e293b' }}>👋 Hi {user.name.en || 'there'}!</p>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>How can we help you today?</p>
             </div>
          ) : (
            messages.map((m, idx) => {
              const userObj = user as any;
              const currentUserId = String(userObj._id || userObj.id || '');
              
              let messageSenderId = '';
              if (m.senderId && typeof m.senderId === 'object') {
                messageSenderId = String((m.senderId as any)._id || '');
              } else {
                messageSenderId = String(m.senderId || '');
              }

              // Logic: It is MINE if senderId matches my ID.
              // Fallback: If adminId is known, and senderId is adminId, it is THEIRS.
              // This helps if my ID logic is somehow flawed but we know it's from admin.
              let mine = messageSenderId === currentUserId;
              
              if (adminId && messageSenderId === adminId) {
                 mine = false;
              }

              return (
                <div key={m._id} className={`chat-message-row ${mine ? 'mine' : 'theirs'}`}>
                  <div className={`chat-bubble ${mine ? 'mine' : 'theirs'}`}>
                    {m.message}
                    <div className="chat-meta">
                       {new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       {mine && (
                         <span>{m.status === 'sending' ? '•••' : '✓'}</span>
                       )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        {user && (
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type your message..."
                className="chat-textarea"
                rows={1}
              />
              <button
                disabled={!text.trim()}
                onClick={send}
                className={`chat-send-btn ${text.trim() ? 'active' : ''}`}
              >
                <FiSend size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
