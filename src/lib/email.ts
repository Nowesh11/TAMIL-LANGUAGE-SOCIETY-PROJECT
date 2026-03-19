// Minimal email utility with safe fallback.
// If SMTP env vars are provided, you can wire an actual sender here.
// For now, we log to console to avoid runtime failures when not configured.

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmailSafe(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const from = 'onboarding@resend.dev'; // Hardcoding to onboarding domain as unimalayatls@gmail.com is likely not verified on Resend
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('Email dispatch (fallback):', { from, ...payload });
    return { ok: false, error: 'Resend API key not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: errText };
    }

    return { ok: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to send email';
    return { ok: false, error };
  }
}