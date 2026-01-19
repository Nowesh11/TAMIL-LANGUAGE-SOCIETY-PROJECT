import nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Common styles for all templates
const commonStyles = `
  body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #1a237e 0%, #4f46e5 100%); color: white; padding: 30px 20px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
  .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
  .content { padding: 30px; }
  .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #e9ecef; }
  .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
  .button:hover { background: #4338ca; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table th { text-align: left; padding: 10px; border-bottom: 1px solid #e9ecef; color: #6c757d; font-weight: 600; font-size: 13px; }
  .info-table td { padding: 10px; border-bottom: 1px solid #e9ecef; font-size: 14px; }
  .highlight { color: #4f46e5; font-weight: 600; }
  .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: #e0e7ff; color: #4f46e5; }
`;

// Email templates
const templates = {
  notification: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Tamil Language Society</h1>
                <p>தமிழ் மொழி சங்கம்</p>
            </div>
            <div class="content">
                <div style="margin-bottom: 15px;">
                    <span class="badge">${data.type}</span>
                    <span style="float: right; color: #6c757d; font-size: 12px;">${new Date().toLocaleDateString()}</span>
                </div>
                <h2 style="margin-top: 0; color: #1f2937;">${data.title}</h2>
                <p style="color: #4b5563;">${data.message}</p>
                ${data.actionUrl ? `<div style="text-align: center;"><a href="${process.env.NEXT_PUBLIC_BASE_URL}${data.actionUrl}" class="button">${data.actionText || 'View Details'}</a></div>` : ''}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Tamil Language Society. All rights reserved.</p>
                <p>You received this email because you are a member of our community.</p>
            </div>
        </div>
    </body>
    </html>
  `,
  
  passwordReset: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset</h1>
                <p>Security Verification</p>
            </div>
            <div class="content">
                <p>Hello ${data.userName},</p>
                <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                
                <div style="background: #f3f4f6; border: 2px dashed #e5e7eb; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px;">
                    <span style="font-size: 32px; font-weight: 700; letter-spacing: 5px; color: #1f2937;">${data.verificationCode}</span>
                </div>
                
                <p style="font-size: 13px; color: #6b7280; text-align: center;">This code expires in <strong>${data.expiresIn}</strong>.</p>
                
                <p style="margin-top: 20px; font-size: 13px; color: #dc2626;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
                <p>This is an automated security message.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  projectAlert: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Project Alert</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Project Launch</h1>
                <p>புதிய திட்டம்</p>
            </div>
            <div class="content">
                ${data.imageUrl ? `<img src="${process.env.NEXT_PUBLIC_BASE_URL}${data.imageUrl}" alt="Project" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">` : ''}
                <h2 style="color: #1f2937;">${data.title}</h2>
                <p style="color: #4b5563;">${data.message}</p>
                
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px; font-size: 16px;">Project Highlights</h3>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                        <li>Status: <span class="highlight">${data.status || 'Active'}</span></li>
                        <li>Type: ${data.type || 'General'}</li>
                    </ul>
                </div>

                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}${data.actionUrl}" class="button">View Project</a>
                </div>
            </div>
            <div class="footer">
                <p>Stay tuned for more updates from Tamil Language Society.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  bookPurchaseReceipt: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Purchase Receipt</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Confirmation</h1>
                <p>Order #${data.orderId}</p>
            </div>
            <div class="content">
                <p>Hello ${data.userName},</p>
                <p>Thank you for your purchase! We're getting your order ready to be shipped.</p>
                
                <h3 style="border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 25px;">Order Summary</h3>
                <table class="info-table">
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                    </tr>
                    ${data.items.map((item: any) => `
                    <tr>
                        <td>${item.title}</td>
                        <td>${item.quantity}</td>
                        <td>${item.price}</td>
                    </tr>
                    `).join('')}
                    <tr style="border-top: 2px solid #e5e7eb;">
                        <td colspan="2" style="text-align: right; font-weight: bold;">Total</td>
                        <td style="font-weight: bold; color: #4f46e5;">${data.total}</td>
                    </tr>
                </table>

                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; color: #166534; font-size: 14px;"><strong>Shipping to:</strong><br/>${data.shippingAddress}</p>
                </div>

                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account/purchases" class="button">Track Order</a>
                </div>
            </div>
            <div class="footer">
                <p>If you have any questions about your order, please reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  ebookDownload: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Ebook Download</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Happy Reading!</h1>
                <p>Ebook Downloaded</p>
            </div>
            <div class="content">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://cdn-icons-png.flaticon.com/512/3389/3389081.png" alt="Book" style="width: 80px; opacity: 0.8;">
                </div>
                <h2 style="text-align: center; margin-top: 0;">${data.bookTitle}</h2>
                <p style="text-align: center; color: #4b5563;">You have successfully downloaded this ebook. We hope you enjoy reading it!</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}${data.actionUrl}" class="button">View Ebook Page</a>
                </div>
            </div>
            <div class="footer">
                <p>Explore more ebooks in our digital library.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  teamAlert: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Team Member</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Meet Our New Team Member</h1>
                <p>Team Update</p>
            </div>
            <div class="content">
                ${data.imageUrl ? `<div style="text-align: center;"><img src="${process.env.NEXT_PUBLIC_BASE_URL}${data.imageUrl}" alt="${data.name}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;"></div>` : ''}
                <h2 style="text-align: center; margin: 0; color: #1f2937;">${data.name}</h2>
                <p style="text-align: center; color: #4f46e5; font-weight: 600; margin: 5px 0 20px;">${data.position}</p>
                
                <p style="color: #4b5563; text-align: center;">We are thrilled to welcome ${data.name} to our team!</p>
                
                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/about" class="button">View Team</a>
                </div>
            </div>
            <div class="footer">
                <p>Building a stronger community together.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  posterAlert: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Poster Added</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>New Gallery Update</h1>
                <p>Latest Poster</p>
            </div>
            <div class="content">
                ${data.imageUrl ? `<img src="${process.env.NEXT_PUBLIC_BASE_URL}${data.imageUrl}" alt="Poster" style="width: 100%; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px;">` : ''}
                <h2 style="color: #1f2937;">${data.title}</h2>
                <p style="color: #4b5563;">${data.message}</p>
                
                <div style="text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}${data.actionUrl}" class="button">View Gallery</a>
                </div>
            </div>
            <div class="footer">
                <p>Check out our gallery for more visual stories.</p>
            </div>
        </div>
    </body>
    </html>
  `,

  orderStatusUpdate: (data: any) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Status Update</title>
        <style>${commonStyles}</style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Order Update</h1>
                <p>Order #${data.orderId}</p>
            </div>
            <div class="content">
                <div style="text-align: center; margin-bottom: 20px;">
                    <span class="badge" style="background: ${data.statusColor}; color: ${data.statusTextColor}; font-size: 14px; padding: 8px 16px;">
                        ${data.status.toUpperCase()}
                    </span>
                </div>
                
                <p>Hello ${data.userName},</p>
                <p>${data.message}</p>

                ${data.trackingNumber ? `
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Tracking Number</p>
                    <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold; color: #1f2937; letter-spacing: 1px;">${data.trackingNumber}</p>
                    ${data.carrier ? `<p style="margin: 5px 0 0; font-size: 14px; color: #4b5563;">via ${data.carrier}</p>` : ''}
                </div>
                ` : ''}

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL}/account/purchases" class="button">Track Order</a>
                </div>
            </div>
            <div class="footer">
                <p>Thank you for shopping with Tamil Language Society.</p>
            </div>
        </div>
    </body>
    </html>
  `
};

// Create transporter
const createTransporter = async () => {
  // Production or Explicit Configuration
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development / Fallback (Ethereal Email)
  console.log('⚠️ SMTP credentials not found. Using Ethereal (Dev) email service.');
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const sendEmail = async ({ to, subject, template, data }: EmailData) => {
  try {
    const transporter = await createTransporter();
    const templateFunction = templates[template as keyof typeof templates];
    
    if (!templateFunction) {
      console.warn(`Template '${template}' not found, falling back to notification`);
      // ... fallback logic ...
    }

    // Use fallback if template function is missing, otherwise use template
    const html = templateFunction ? templateFunction(data) : templates.notification(data);

    const mailOptions = {
      from: process.env.SMTP_USER ? `"Tamil Language Society" <${process.env.SMTP_USER}>` : '"TLS Dev" <dev@tamilsociety.org>',
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent (${template}):`, result.messageId);
    
    // Log Preview URL for Ethereal
    if (!process.env.SMTP_USER) {
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
    }
    
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message || String(error) };
  }
};

export const sendBulkEmails = async (emails: EmailData[]) => {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  );
  
  return results.map((result, index) => ({
    email: emails[index].to,
    success: result.status === 'fulfilled' && result.value.success,
    error: result.status === 'rejected' ? result.reason : 
           (result.status === 'fulfilled' && !result.value.success ? result.value.error : null)
  }));
};

export default { sendEmail, sendBulkEmails };
