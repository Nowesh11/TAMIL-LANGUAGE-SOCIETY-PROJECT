'use client';

import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { safeFetchJson } from '../lib/safeFetch';
import { useAuth } from '../hooks/useAuth';
import { io } from 'socket.io-client';
import { FiSend, FiX, FiMessageSquare } from 'react-icons/fi';

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
          const uniquePrev = prev.filter(m => !fetchedIds.has(m._id));
          return [...fetched, ...uniquePrev].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });
      }
    };
    loadHistory();

    // Connect Socket
    fetch('/api/socket/init')
      .then((res) => {
        if (res.ok && isMounted) {
           socketRef.current = io({ 
             path: '/api/socket/io',
             addTrailingSlash: false,
             transports: ['polling', 'websocket'],
           });

           socketRef.current.on('connect', () => {
             console.log('Chat connected');
             if (isMounted) setSocketConnected(true);
             if (user) {
                  const userId = (user as any)._id || (user as any).id;
                  socketRef.current.emit('join-room', userId);
             }
           });

           socketRef.current.on('receive-message', (message: any) => {
             if (!isMounted) return;
             setMessages(prev => {
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
  }, [open, (user as any)?._id || (user as any)?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, open]);

  const send = async () => {
    if (!text.trim() || !user) return;

    const tempId = Date.now().toString();
    const newMsg: ChatMessage = {
      _id: tempId,
      senderId: (user as any)._id || (user as any).id,
      recipientId: 'admin',
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
        setMessages(prev => prev.map(m => m._id === tempId ? { ...res.message, status: 'sent' } : m));
        if (socketRef.current) {
          socketRef.current.emit('send-message', {
             ...res.message,
             recipientId: res.message.recipientId
          });
        }
      } else {
        setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'sent' } : m));
      }
    } catch (e) {
      console.error('Send failed', e);
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'sent' } : m));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="" size="md" dismissOnBackdrop={false}>
      <div className="flex flex-col h-[600px] max-h-[80vh] overflow-hidden bg-[#0a0a0f] rounded-2xl border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(147,51,234,0.4)]">
                 {displayName.charAt(0)}
              </div>
              {socketConnected && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0f] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                {displayName}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                 {socketConnected ? (
                   <>
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
                     <span className="text-green-400 font-medium">Online</span>
                   </>
                 ) : 'Connecting...'}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0f] custom-scrollbar" ref={listRef}>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
               <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
               <p className="text-sm font-medium">Loading conversation...</p>
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 mb-2 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                 <FiMessageSquare size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Join the Conversation</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Sign in to chat directly with our support team and get instant assistance.
                </p>
              </div>
              <button 
                onClick={() => window.location.href = '/login?redirect=/contacts'} 
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all"
              >
                Sign In to Chat
              </button>
            </div>
          ) : messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-60">
                <p className="font-medium text-lg text-gray-300">👋 Hi {user.name.en || 'there'}!</p>
                <p className="text-sm">How can we help you today?</p>
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

              let mine = messageSenderId === currentUserId;
              
              if (adminId && messageSenderId === adminId) {
                 mine = false;
              }

              return (
                <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
                  <div className={`max-w-[80%] p-3.5 rounded-2xl shadow-sm relative group ${
                    mine 
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                      : 'bg-white/10 border border-white/10 text-gray-200 rounded-tl-none backdrop-blur-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                    <div className={`flex items-center gap-1 text-[10px] mt-1.5 opacity-70 ${mine ? 'justify-end text-white/90' : 'text-gray-400'}`}>
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
          <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
            <div className="flex items-end gap-2 bg-black/40 border border-white/10 rounded-xl p-2 focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500/50 transition-all shadow-inner">
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
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 resize-none p-2 text-sm max-h-32 custom-scrollbar"
                rows={1}
                style={{ minHeight: '44px' }}
              />
              <button
                disabled={!text.trim()}
                onClick={send}
                className={`p-3 rounded-lg transition-all duration-200 ${
                  text.trim() 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95' 
                    : 'bg-white/5 text-gray-500 cursor-not-allowed'
                }`}
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
