"use client";
import React, { useEffect, useRef, useState } from 'react';
import Modal from './Modal';
import { safeFetchJson } from '../lib/safeFetch';
import { useAuth } from '../hooks/useAuth';

type ChatMessage = {
  _id: string;
  senderId: string;
  recipientId: string;
  message: string;
  messageType: 'text';
  timestamp: string | Date;
};

export default function ChatModal({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const { user, loading, login } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [adminName, setAdminName] = useState<string>('Admin');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const res = await safeFetchJson('/api/chat');
      if (res?.success) {
        setAdminName(res.admin?.name || 'Admin');
        setMessages(res.messages || []);
      }
    };
    load();
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = async () => {
    const body = { message: text, messageType: 'text' };
    setSending(true);
    try {
      const res = await safeFetchJson('/api/chat', { method: 'POST', body: JSON.stringify(body) });
      if (res?.success && res.message) {
        setMessages((m) => [...m, res.message]);
        setText('');
      }
    } finally {
      setSending(false);
    }
  };

  const header = (
    <div className="flex items-center gap-2">
      <span className="chat-header-icon">
        <i className="fa-solid fa-comments" aria-hidden="true" />
      </span>
      <span className="font-semibold">{adminName}</span>
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title={header} size="sm" dismissOnBackdrop>
      <div className="chat-modal">
        {loading ? (
          <div className="flex-1 grid place-items-center text-sm text-gray-500">Loading...</div>
        ) : !user ? (
          <div className="flex-1 grid place-items-center text-center">
            <div className="space-y-2">
              <p className="text-gray-700">Please sign in to start chatting.</p>
              <button onClick={login} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700">Sign In</button>
            </div>
          </div>
        ) : (
          <>
            <div ref={listRef} className="chat-messages">
              {messages.map((m) => {
                const mine = m.senderId === (user as any)?._id || m.senderId === (user as any)?.id;
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`chat-bubble ${mine ? 'chat-bubble--mine' : 'chat-bubble--other'}`}>
                      <div>{m.message}</div>
                      <div className="text-[10px] opacity-70 mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="chat-input-row">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
                className="chat-input"
              />
              <button
                disabled={!text.trim() || sending}
                onClick={send}
                className="chat-send-btn"
              >
                <i className="fa-solid fa-paper-plane" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}