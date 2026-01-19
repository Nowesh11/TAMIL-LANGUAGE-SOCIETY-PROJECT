import { toast } from 'react-hot-toast';

export async function notifyAdminError(title: string, message: string) {
  // Show toast immediately
  toast.error(`${title}: ${message}`);
  
  try {
    const payload = {
      title: { en: title, ta: title },
      message: { en: message, ta: message },
      type: 'error',
      priority: 'urgent',
      targetAudience: 'admins',
      sendEmail: false,
      startAt: new Date().toISOString()
    }
    
    // Get token for auth
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
  } catch {}
}

export async function notifyAdminSuccess(title: string, message: string) {
  // Show toast immediately
  toast.success(`${title}: ${message}`);

  try {
    const payload = {
      title: { en: title, ta: title },
      message: { en: message, ta: message },
      type: 'success',
      priority: 'low',
      targetAudience: 'admins',
      sendEmail: false,
      startAt: new Date().toISOString()
    }

    // Get token for auth
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
  } catch {}
}

export async function fetchAdminNotifications(limit = 10) {
  // Get token for auth
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/notifications?limit=${limit}`, { headers })
  return res.json()
}
