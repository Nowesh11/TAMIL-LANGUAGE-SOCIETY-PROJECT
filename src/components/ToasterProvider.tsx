'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
  return (
    <Toaster 
      position="top-right" 
      reverseOrder={false} 
      toastOptions={{
        className: 'modern-toast',
        style: {
          background: 'var(--surface)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
