import { useEffect, useState, useCallback } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  name: { en: string; ta: string };
  role: 'admin' | 'user';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const loginTime = localStorage.getItem('loginTime');
      
      // Check if token is expired (1 day = 24 hours)
      if (token && loginTime) {
        const now = Date.now();
        const loginTimestamp = parseInt(loginTime);
        const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
        
        if (now - loginTimestamp > oneDayInMs) {
          // Token expired, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('loginTime');
          return null;
        }
        return token;
      }
      return null;
    }
    return null;
  });

  // Auto-logout function
  const autoLogout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('loginTime');
    // Redirect to login page if on admin route
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin/login?message=Session expired. Please login again.';
    }
  }, []);

  // Check for token expiration periodically
  useEffect(() => {
    const checkTokenExpiration = () => {
      if (typeof window !== 'undefined') {
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
          const now = Date.now();
          const loginTimestamp = parseInt(loginTime);
          const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds
          
          if (now - loginTimestamp > oneDayInMs) {
            autoLogout();
          }
        }
      }
    };

    // Check immediately
    checkTokenExpiration();
    
    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoLogout]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        let currentToken = accessToken;
        
        // Obtain an access token via refresh (cookie-based) if missing
        if (!currentToken) {
          const refreshData = await safeFetchJson<{ accessToken?: string; error?: string }>(
            '/api/auth/refresh',
            { method: 'POST' },
            { timeoutMs: 10000 }
          );
          if (refreshData?.accessToken) {
            currentToken = refreshData.accessToken;
            setAccessToken(currentToken);
            localStorage.setItem('accessToken', currentToken);
            localStorage.setItem('loginTime', Date.now().toString());
          }
        }
        
        const headers: Record<string, string> = {};
        if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;
        const me = await safeFetchJson<{ user?: User }>(
          '/api/auth/me',
          { headers },
          { timeoutMs: 10000 }
        );
        if (me?.user) {
          setUser(me.user);
        } else {
          setUser(null);
          // If token was invalid, clear it
          if (currentToken) {
            setAccessToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('loginTime');
          }
        }
      } catch {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('loginTime');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    console.log('[useAuth] Sending login request for:', email);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log('[useAuth] Response status:', res.status);
      
      if (!res.ok) {
        const errText = await res.text();
        console.error('[useAuth] Login failed:', errText);
        let errMsg = 'Login failed';
        try {
          errMsg = JSON.parse(errText).error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      
      const data = await res.json();
      console.log('[useAuth] Login success, received data');
      
      // Store access token and login time in both state and localStorage
      setUser(data.user);
      setAccessToken(data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('loginTime', Date.now().toString());
      toast.success('Login successful!');
      return { success: true, user: data.user, accessToken: data.accessToken };
    } catch (e: any) {
      console.error('[useAuth] Login exception:', e);
      toast.error(e.message || 'Login failed');
      return { success: false, error: e.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully');
    } catch (e) {
      console.error('Logout error', e);
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('loginTime');
  };

  const redirectByRole = () => {
    if (!user) return;
    if (user.role === 'admin') {
      window.location.href = '/admin/dashboard';
    }
  };

  return { user, loading, login, logout, accessToken, redirectByRole };
}