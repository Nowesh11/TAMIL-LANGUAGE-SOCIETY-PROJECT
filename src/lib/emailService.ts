import nodemailer from 'nodemailer'

type EmailPayload = {
  to: string
  subject: string
  template: string
  data?: Record<string, any>
}

function baseLayout(inner: string, promo?: string) {
  const styles = `
    :root{color-scheme:light dark}
    body{margin:0;background:#0a0a0f;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
    .wrap{padding:24px}
    .card{max-width:860px;margin:0 auto;background:#0f1117;border-radius:16px;overflow:hidden;border:1px solid #243244;box-shadow:0 10px 30px rgba(0,0,0,0.35)}
    .bar{height:8px;background:linear-gradient(90deg,#4f46e5,#06b6d4,#22c55e,#f59e0b)}
    .header{padding:24px 24px 12px 24px}
    .title{margin:0;font-size:22px;line-height:1.25;color:#ffffff}
    .muted{color:#94a3b8}
    .grid{width:100%;border-collapse:collapse}
    .left{vertical-align:top;padding:0}
    .right{vertical-align:top;padding:0;width:280px;background:#0b1016;border-left:1px solid #243244}
    .content{padding:20px}
    .sidebar{padding:20px}
    .promo{background:linear-gradient(135deg,rgba(79,70,229,0.15),rgba(6,182,212,0.12));border:1px solid #243244;border-radius:12px;padding:16px}
    .promo h3{margin:0 0 8px 0;font-size:16px;color:#e5e7eb}
    .promo p{margin:0 0 12px 0;color:#94a3b8;font-size:14px}
    .promo img{max-width:100%;border-radius:10px;margin:8px 0}
    .btn{display:inline-block;padding:10px 16px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none}
    .cta{display:inline-block;padding:10px 16px;border-radius:10px;background:linear-gradient(90deg,#4f46e5,#06b6d4);color:#fff;text-decoration:none}
    .table{width:100%;border-collapse:collapse;margin:6px 0 10px}
    .table th{background:#0b1016;color:#94a3b8;text-align:left;padding:10px;border-bottom:1px solid #243244;font-weight:600}
    .table td{padding:10px;border-bottom:1px solid #243244;color:#e5e7eb}
    .sum{margin-top:10px;color:#e5e7eb}
    .footer{padding:18px 24px;border-top:1px solid #243244;color:#94a3b8;font-size:12px}
    @media(max-width:720px){.right{display:block;width:auto;border-left:none}.grid,.left,.right{display:block}.sidebar{padding:0 20px 20px}}
  `
  const sidebar = promo ? `<div class="sidebar">${promo}</div>` : ''
  return `
    <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${styles}</style></head>
    <body><div class="wrap"><div class="card">
      <div class="bar"></div>
      <table class="grid"><tr>
        <td class="left">${inner}</td>
        <td class="right">${sidebar}</td>
      </tr></table>
      <div class="footer">Tamil Language Society • This is an automated message</div>
    </div></div></body></html>
  `
}

function renderPromo(data: Record<string, any>) {
  const title = data.title || 'Featured'
  const text = data.text || 'Explore the latest from our society'
  const imageUrl = data.imageUrl || ''
  const actionUrl = data.actionUrl || ''
  const actionText = data.actionText || 'Learn More'
  const img = imageUrl ? `<img src="${imageUrl}" alt="">` : ''
  const cta = actionUrl ? `<a class="btn" href="${actionUrl}">${actionText}</a>` : ''
  return `<div class="promo"><h3>${title}</h3><p>${text}</p>${img}${cta}</div>`
}

function renderNotification(data: Record<string, any>) {
  const title = data.title || ''
  const message = data.message || ''
  const actionUrl = data.actionUrl || ''
  const actionText = data.actionText || ''
  const imageUrl = data.imageUrl || ''
  const imgBlock = imageUrl ? `<div style="margin:16px 0"><img src="${imageUrl}" alt="" /></div>` : ''
  const actionBlock = actionUrl && actionText ? `<p><a class="cta" href="${actionUrl}">${actionText}</a></p>` : ''
  const inner = `
    <div class="header"><h1 class="title">${title}</h1><div class="muted">Society Update</div></div>
    <div class="content">
      ${imgBlock}
      <p>${message}</p>
      ${actionBlock}
    </div>
  `
  const promo = data.ad ? renderPromo(data.ad) : ''
  return baseLayout(inner, promo)
}

function renderBookPurchaseReceipt(data: Record<string, any>) {
  const orderId = data.orderId || ''
  const userName = data.userName || 'Customer'
  const items: Array<{ title: string; qty: number; price: number }> = data.items || []
  const subtotal = data.subtotal ?? 0
  const tax = data.tax ?? 0
  const shipping = data.shipping ?? 0
  const total = data.total ?? (subtotal + tax + shipping)
  const rows = items.map(i => `
    <tr><td>${i.title}</td><td class="muted">${i.qty}</td><td>RM ${(i.price || 0).toFixed(2)}</td></tr>
  `).join('')
  const actionUrl = data.actionUrl || ''
  const actionText = data.actionText || 'View Order'
  const ship = data.shippingAddress ? `<p class="muted">Ship To: ${data.shippingAddress}</p>` : ''
  const inner = `
    <div class="header"><h1 class="title">Order Confirmed</h1><div class="muted">Order #${orderId}</div></div>
    <div class="content">
      <p>Hello ${userName}, thank you for your purchase. Here is your receipt.</p>
      ${ship}
      <table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="sum">Subtotal: RM ${subtotal.toFixed(2)} • Tax: RM ${tax.toFixed(2)} • Shipping: RM ${shipping.toFixed(2)}</div>
      <h3 class="sum">Total: RM ${total.toFixed(2)}</h3>
      ${actionUrl ? `<p><a class="cta" href="${actionUrl}">${actionText}</a></p>` : ''}
    </div>
  `
  const promo = data.ad ? renderPromo(data.ad) : ''
  return baseLayout(inner, promo)
}

function renderOrderStatusUpdate(data: Record<string, any>) {
  const title = data.title || 'Order Update'
  const message = data.message || ''
  const orderId = data.orderId || ''
  const trackingNumber = data.trackingNumber || ''
  const carrier = data.carrier || ''
  const actionUrl = data.actionUrl || ''
  const actionText = data.actionText || 'Track Order'
  const trackingBlock = trackingNumber ? `<p>Tracking: <strong>${trackingNumber}</strong> ${carrier ? `via ${carrier}` : ''}</p>` : ''
  const inner = `
    <div class="header"><h1 class="title">${title}</h1><div class="muted">Order #${orderId}</div></div>
    <div class="content">
      <p>${message}</p>
      ${trackingBlock}
      ${actionUrl ? `<p><a class="cta" href="${actionUrl}">${actionText}</a></p>` : ''}
    </div>
  `
  const promo = data.ad ? renderPromo(data.ad) : ''
  return baseLayout(inner, promo)
}

function renderPasswordReset(data: Record<string, any>) {
  const userName = data.userName || 'User'
  const resetLink = data.resetLink || ''
  const inner = `
    <div class="header"><h1 class="title">Password Reset</h1><div class="muted">Security Notice</div></div>
    <div class="content">
      <p>Hello ${userName}, we received a request to reset your password.</p>
      ${resetLink ? `<p><a class="cta" href="${resetLink}">Reset Password</a></p>` : ''}
      <p class="muted">If you did not request this, you can ignore this email.</p>
    </div>
  `
  const promo = data.ad ? renderPromo(data.ad) : ''
  return baseLayout(inner, promo)
}

function renderPasswordForgot(data: Record<string, any>) {
  const userName = data.userName || 'User'
  const token = data.token || ''
  const inner = `
    <div class="header"><h1 class="title">Password Reset Code</h1><div class="muted">Use within 15 minutes</div></div>
    <div class="content">
      <p>Hello ${userName}, use the following code to reset your password:</p>
      <h2 style="letter-spacing:2px;background:#0b1016;color:#e5e7eb;display:inline-block;padding:12px 18px;border-radius:12px;border:1px solid #243244">${token}</h2>
      <p class="muted">If you did not request this, you can ignore this email.</p>
    </div>
  `
  const promo = data.ad ? renderPromo(data.ad) : ''
  return baseLayout(inner, promo)
}

function renderTemplate(name: string, data: Record<string, any> = {}) {
  const title = data.title || ''
  const message = data.message || ''
  const actionUrl = data.actionUrl || ''
  const actionText = data.actionText || ''
  const imageUrl = data.imageUrl || ''
  switch (name) {
    case 'bookPurchaseReceipt':
      return renderBookPurchaseReceipt(data)
    case 'orderStatusUpdate':
      return renderOrderStatusUpdate({ title, message, ...data })
    case 'passwordReset':
      return renderPasswordReset(data)
    case 'passwordForgot':
      return renderPasswordForgot(data)
    default:
      return renderNotification({ title, message, actionUrl, actionText, imageUrl, ad: data.ad })
  }
}

export async function sendEmail({ to, subject, template, data = {} }: EmailPayload) {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || 465)

  if (!user || !pass) throw new Error('SMTP credentials missing')

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  })

  const html = renderTemplate(template || 'notification', {
    ad: data.ad || {
      title: 'Support Our Mission',
      text: 'Donate or volunteer to help us promote Tamil language and culture.',
      actionUrl: 'https://example.org/support',
      actionText: 'Support Now'
    },
    ...data
  })
  const from = process.env.EMAIL_FROM || `Tamil Language Society <${user}>`

  await transporter.sendMail({ from, to, subject, html })
  return true
}
