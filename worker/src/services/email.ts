/**
 * Email service for Cloudflare Workers.
 * Uses Resend (https://resend.com) — a simple, reliable transactional email API.
 * If RESEND_API_KEY is not configured, all send functions are no-ops (won't break the form).
 */

export interface EmailMessage {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  reply_to?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'HI-NOVA APEX LLP <noreply@hinovaapex.com>';
const NOTIFICATION_TO = ['enquiry@hinovaapex.com', 'contact@hinovaapex.com'];

export async function sendEmail(
  apiKey: string | undefined,
  message: EmailMessage
): Promise<EmailResult> {
  if (!apiKey) {
    console.warn('RESEND_API_KEY not configured — skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  const payload = {
    from: message.from || DEFAULT_FROM,
    to: Array.isArray(message.to) ? message.to : [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
    reply_to: message.reply_to,
  };

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `Resend API error: ${res.status} ${errorText}` };
    }

    const result = await res.json() as { id: string };
    return { success: true, id: result.id };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function buildContactNotificationHtml(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}): { html: string; text: string; subject: string } {
  const subject = data.subject
    ? `[HI-NOVA Contact] ${data.subject} — from ${data.name}`
    : `[HI-NOVA Contact] New message from ${data.name}`;

  const text = [
    `New contact form submission on hinovaapex.com`,
    ``,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone || '—'}`,
    `Subject: ${data.subject || '—'}`,
    ``,
    `Message:`,
    data.message,
    ``,
    `— Sent automatically by the HI-NOVA APEX LLP website`,
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a1a; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">HI-NOVA APEX LLP Website</p>
        </div>
        <div style="background: #f8f8f8; padding: 30px 20px; border: 1px solid #eee; border-top: none;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 700; width: 100px; vertical-align: top;">Name:</td>
              <td style="padding: 8px 0;">${escapeHtml(data.name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 700; vertical-align: top;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(data.email)}" style="color: #FF6B35;">${escapeHtml(data.email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 700; vertical-align: top;">Phone:</td>
              <td style="padding: 8px 0;">${data.phone ? escapeHtml(data.phone) : '—'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 700; vertical-align: top;">Subject:</td>
              <td style="padding: 8px 0;">${data.subject ? escapeHtml(data.subject) : '—'}</td>
            </tr>
          </table>
        </div>
        <div style="background: white; padding: 30px 20px; border: 1px solid #eee; border-top: none;">
          <h2 style="margin: 0 0 15px; font-size: 16px; color: #1a1a1a;">Message</h2>
          <p style="margin: 0; white-space: pre-wrap; color: #333;">${escapeHtml(data.message)}</p>
        </div>
        <div style="background: #f8f8f8; padding: 20px; text-align: center; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">Reply directly to this email to respond to <strong>${escapeHtml(data.name)}</strong>.</p>
        </div>
      </body>
    </html>
  `;

  return { html, text, subject };
}

export function buildNewsletterWelcomeHtml(email: string): { html: string; text: string; subject: string } {
  const subject = 'Welcome to the HI-NOVA APEX LLP Newsletter';
  const text = [
    `Thank you for subscribing to the HI-NOVA APEX LLP newsletter.`,
    ``,
    `You'll receive occasional updates on:`,
    `- New process equipment and engineered solutions`,
    `- Manufacturing capabilities and project highlights`,
    `- Industry insights, innovation, and engineering best practices`,
    ``,
    `Visit us anytime at https://www.hinovaapex.com`,
    ``,
    `— The HI-NOVA APEX LLP Team`,
  ].join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a1a1a; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to HI-NOVA</h1>
          <p style="margin: 8px 0 0; opacity: 0.8;">Engineering the Future of Industrial Performance</p>
        </div>
        <div style="background: white; padding: 30px 20px; border: 1px solid #eee; border-top: none;">
          <p>Thank you for subscribing. You're now part of a growing community of engineers, plant operators, and industry leaders who trust HI-NOVA APEX LLP for high-performance process equipment and integrated industrial solutions.</p>
          <p>You'll hear from us about:</p>
          <ul>
            <li>New process equipment and engineered solutions</li>
            <li>Manufacturing capabilities and project highlights</li>
            <li>Industry insights and engineering best practices</li>
          </ul>
          <p style="text-align: center; margin: 30px 0 0;">
            <a href="https://www.hinovaapex.com" style="background: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Visit Our Website</a>
          </p>
        </div>
        <div style="background: #f8f8f8; padding: 20px; text-align: center; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; font-size: 12px; color: #666;">
          <p style="margin: 0;">You subscribed with: <strong>${escapeHtml(email)}</strong></p>
          <p style="margin: 5px 0 0;">HI-NOVA APEX LLP · Plot No. D-33, Anand Nagar Additional MIDC, Ambernath East, Thane, Maharashtra 421301, India</p>
        </div>
      </body>
    </html>
  `;

  return { html, text, subject };
}

export async function sendContactNotification(
  apiKey: string | undefined,
  data: { name: string; email: string; phone?: string; subject?: string; message: string }
): Promise<EmailResult> {
  const { html, text, subject } = buildContactNotificationHtml(data);
  return sendEmail(apiKey, {
    to: NOTIFICATION_TO,
    subject,
    html,
    text,
    reply_to: data.email,
  });
}

export async function sendNewsletterWelcome(
  apiKey: string | undefined,
  email: string
): Promise<EmailResult> {
  const { html, text, subject } = buildNewsletterWelcomeHtml(email);
  return sendEmail(apiKey, {
    to: email,
    subject,
    html,
    text,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
