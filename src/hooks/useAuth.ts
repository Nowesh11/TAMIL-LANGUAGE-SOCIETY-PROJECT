import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';

interface User {
  id: string;
  email: string;
  name: { en: string; ta: string };
  role: 'admin' | 'user';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        // Obtain an access token via refresh (cookie-based) if missing
        if (!accessToken) {
          const refreshData = await safeFetchJson<{ accessToken?: string; error?: string }>(
            '/api/auth/refresh',
            { method: 'POST' }
          );
          if (refreshData?.accessToken) setAccessToken(refreshData.accessToken);
        }
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const me = await safeFetchJson<{ user?: User }>(
          '/api/auth/me',
          { headers }
        );
        if (me?.user) setUser(me.user);
        else setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    // accessToken returned; in SPA you might store in memory/local storage; here rely on cookie for refresh and bearer for APIs
    setUser(data.user);
    setAccessToken(data.accessToken);
    return data;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setAccessToken(null);
  };

  const redirectByRole = () => {
    if (!user) return;
    if (user.role === 'admin') {
      window.location.href = '/admin';
    }
  };

  return { user, loading, login, logout, accessToken, redirectByRole };
}