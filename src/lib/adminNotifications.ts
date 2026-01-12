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
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch {}
}

export async function fetchAdminNotifications(limit = 10) {
  const res = await fetch(`/api/notifications?limit=${limit}`)
  return res.json()
}
