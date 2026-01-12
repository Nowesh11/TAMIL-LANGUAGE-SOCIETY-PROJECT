// Minimal email utility with safe fallback.
// If SMTP env vars are provided, you can wire an actual sender here.
// For now, we log to console to avoid runtime failures when not configured.

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmailSafe(payload: EmailPayload): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'no-reply@tamilsociety.org';

  // Placeholder: if SMTP is not configured, just log and return ok=false (queued)
  if (!host || !user || !pass) {
    console.log('Email dispatch (fallback):', { from, ...payload });
    return { ok: false, error: 'SMTP not configured' };
  }

  // In future: integrate nodemailer or any provider
  try {
    console.log('Email dispatch (stub):', { from, ...payload });
    return { ok: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to send email';
    return { ok: false, error };
  }
}