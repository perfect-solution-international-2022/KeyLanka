import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

export async function sendMail(options: { to: string; subject: string; html: string; replyTo?: string }) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      ...options,
    });
    return true;
  } catch (err) {
    // Email is a side effect of checkout/contact/reset flows — a delivery
    // failure must never break the request that triggered it.
    console.error("sendMail failed:", err);
    return false;
  }
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout(title: string, bodyHtml: string) {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
      <div style="background:#e8332a; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <span style="color:#fff; font-size: 18px; font-weight: bold;">KEY LANKA</span>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
        <h1 style="font-size: 18px; margin: 0 0 16px;">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <p style="text-align:center; color:#9ca3af; font-size: 12px; margin-top: 16px;">
        Key Lanka &middot; No 620 High Level Road, Wijerama, Nugegoda &middot; 077 777 7678
      </p>
    </div>
  `;
}

export function renderPasswordResetEmail(name: string, resetUrl: string) {
  return layout(
    "Reset your password",
    `
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received a request to reset your Key Lanka account password. Click the button below to choose a new one. This link expires in 1 hour.</p>
      <p style="margin: 24px 0;">
        <a href="${escapeHtml(resetUrl)}" style="background:#e8332a; color:#fff; text-decoration:none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display:inline-block;">Reset Password</a>
      </p>
      <p style="color:#6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    `
  );
}

export function renderOrderConfirmationEmail(params: {
  name: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: string }[];
  total: string;
  shippingAddress: string;
}) {
  const rows = params.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0; border-bottom:1px solid #f3f4f6;">${escapeHtml(i.name)} &times; ${i.quantity}</td>
          <td style="padding:8px 0; border-bottom:1px solid #f3f4f6; text-align:right;">Rs. ${(Number(i.price) * i.quantity).toLocaleString()}</td>
        </tr>`
    )
    .join("");

  return layout(
    "Your order is confirmed",
    `
      <p>Hi ${escapeHtml(params.name)},</p>
      <p>Thanks for your order! We've received <strong>${escapeHtml(params.orderNumber)}</strong> and it's now being processed.</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        ${rows}
        <tr>
          <td style="padding:12px 0 0; font-weight:bold;">Total</td>
          <td style="padding:12px 0 0; font-weight:bold; text-align:right;">Rs. ${Number(params.total).toLocaleString()}</td>
        </tr>
      </table>
      <p style="font-size: 13px; color:#6b7280;">Shipping to: ${escapeHtml(params.shippingAddress)}</p>
    `
  );
}

export function renderContactNotificationEmail(params: { name: string; email: string; message: string }) {
  return layout(
    "New contact form message",
    `
      <p><strong>From:</strong> ${escapeHtml(params.name)} (${escapeHtml(params.email)})</p>
      <p style="white-space: pre-wrap;">${escapeHtml(params.message)}</p>
    `
  );
}

export function renderAdminLoginCodeEmail(name: string, code: string) {
  return layout(
    "Admin login verification",
    `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Use this one-time code to finish signing in to Key Lanka Admin:</p>
      <p style="font-size:28px; font-weight:bold; letter-spacing:6px; margin:24px 0;">${escapeHtml(code)}</p>
      <p style="color:#6b7280; font-size:13px;">This code expires in 10 minutes. If this wasn't you, change your password immediately.</p>
    `
  );
}
