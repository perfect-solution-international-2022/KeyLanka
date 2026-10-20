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

export async function sendMail(options: { to: string; subject: string; html: string; replyTo?: string; bcc?: string }) {
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
      <div style="background:#d62b23; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <span style="color:#fff; font-size: 18px; font-weight: bold;">KEY LANKA</span>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 24px;">
        <h1 style="font-size: 18px; margin: 0 0 16px;">${escapeHtml(title)}</h1>
        ${bodyHtml}
      </div>
      <p style="text-align:center; color:#9ca3af; font-size: 12px; margin-top: 16px;">
        Key Lanka &middot; No 620 High Level Road, Wijerama, Nugegoda &middot; 011 2 812 789 &middot; 076 5 662 666 &middot; 077 7 777 678
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
        <a href="${escapeHtml(resetUrl)}" style="background:#d62b23; color:#fff; text-decoration:none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display:inline-block;">Reset Password</a>
      </p>
      <p style="color:#6b7280; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
    `
  );
}

export function renderOrderConfirmationEmail(params: {
  name: string;
  orderNumber: string;
  orderId?: number;
  items: { name: string; quantity: number; price: string }[];
  total: string;
  shippingAddress: string;
}) {
  const money = (value: number) =>
    `Rs. ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  let orderUrl: string | undefined;
  if (params.orderId && process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(`/account/orders/${params.orderId}`, process.env.NEXT_PUBLIC_APP_URL);
      if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) {
        orderUrl = url.href;
      }
    } catch {
      // The confirmation remains useful when the public app URL is not configured.
    }
  }
  const rows = params.items
    .map(
      (i) => `
        <tr>
          <td style="padding:18px 12px 18px 0; border-bottom:1px solid #e5e7eb; vertical-align:top; overflow-wrap:anywhere; word-break:break-word;">
            <p style="margin:0 0 6px; color:#202632; font-size:14px; font-weight:bold; line-height:22px;">${escapeHtml(i.name)}</p>
            <p style="margin:0; color:#626975; font-size:12px; line-height:20px;">Qty: ${escapeHtml(i.quantity)} &nbsp;&middot;&nbsp; ${money(Number(i.price))} each</p>
          </td>
          <td style="padding:18px 0; border-bottom:1px solid #e5e7eb; text-align:right; vertical-align:top; color:#202632; font-size:14px; font-weight:bold; line-height:22px; overflow-wrap:anywhere;">${money(Number(i.price) * i.quantity)}</td>
        </tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="format-detection" content="telephone=no" />
  <title>Order confirmed | ${escapeHtml(params.orderNumber)} | Key Lanka</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { padding:16px 8px !important; }
      .email-content { padding:28px 20px !important; }
      .email-header { padding:24px 20px !important; }
      .email-heading { font-size:28px !important; line-height:34px !important; }
      .email-footer { padding:24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#f3f4f6; color:#202632; font-family:Arial, Helvetica, sans-serif; -webkit-text-size-adjust:100%;">
  <div style="display:none; font-size:1px; line-height:1px; color:#f3f4f6; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">We've received your order ${escapeHtml(params.orderNumber)}. Your order summary and delivery details are inside.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; background-color:#f3f4f6;">
    <tr><td class="email-shell" align="center" style="padding:40px 16px;">
      <!--[if mso]><table role="presentation" width="600" align="center"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px; border-collapse:separate;">
        <tr><td class="email-header" bgcolor="#d62b23" style="padding:28px 36px; background-color:#d62b23; border-radius:12px 12px 0 0;">
          <p style="margin:0; color:#ffffff; font-size:23px; font-weight:bold; letter-spacing:1px; line-height:28px;">KEY LANKA</p>
          <p style="margin:7px 0 0; color:#ffffff; font-size:11px; letter-spacing:2px; line-height:18px;">ORDER CONFIRMATION</p>
        </td></tr>
        <tr><td class="email-content" bgcolor="#ffffff" style="padding:36px; background-color:#ffffff; border:1px solid #e2e5e9; border-top:0; border-radius:0 0 12px 12px;">
          <p style="margin:0 0 12px; color:#626975; font-size:12px; font-weight:bold; letter-spacing:1.5px; line-height:18px;">ORDER RECEIVED</p>
          <h1 class="email-heading" style="margin:0 0 20px; color:#202632; font-size:32px; font-weight:bold; letter-spacing:-0.8px; line-height:39px;">Thanks for your order.</h1>
          <p style="margin:0 0 8px; color:#202632; font-size:15px; line-height:24px;">Hi ${escapeHtml(params.name)},</p>
          <p style="margin:0 0 28px; color:#626975; font-size:14px; line-height:23px;">Your order is confirmed. Here is a summary of your items and delivery details. Thank you for choosing Key Lanka.</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; table-layout:fixed; margin:0 0 28px; border:1px solid #e5e7eb; border-radius:8px; background-color:#f8f9fb;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0 0 4px; color:#626975; font-size:11px; font-weight:bold; letter-spacing:1px; line-height:18px;">ORDER NUMBER</p>
              <p style="margin:0; color:#202632; font-size:18px; font-weight:bold; line-height:26px; overflow-wrap:anywhere;">${escapeHtml(params.orderNumber)}</p>
            </td></tr>
          </table>

          <h2 style="margin:0 0 12px; color:#202632; font-size:17px; line-height:24px;">Order summary</h2>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" aria-label="Order items" style="width:100%; table-layout:fixed; border-collapse:collapse;">
            <thead><tr>
              <th scope="col" width="62%" style="width:62%; padding:0 12px 10px 0; border-bottom:1px solid #e5e7eb; color:#626975; font-size:11px; font-weight:normal; letter-spacing:1px; text-align:left; line-height:18px;">ITEM / QUANTITY</th>
              <th scope="col" width="38%" style="width:38%; padding:0 0 10px; border-bottom:1px solid #e5e7eb; color:#626975; font-size:11px; font-weight:normal; letter-spacing:1px; text-align:right; line-height:18px;">AMOUNT</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; table-layout:fixed; margin:16px 0 28px; background-color:#f8f9fb; border-radius:8px;">
            <tr>
              <td width="38%" style="width:38%; padding:18px 8px 18px 18px; color:#202632; font-size:14px; font-weight:bold; line-height:24px;">Order total</td>
              <td width="62%" style="width:62%; padding:18px 18px 18px 0; color:#202632; font-size:21px; font-weight:bold; line-height:28px; text-align:right; overflow-wrap:anywhere;">${money(Number(params.total))}</td>
            </tr>
          </table>

          <h2 style="margin:0 0 10px; color:#202632; font-size:17px; line-height:24px;">Delivery address</h2>
          <p style="margin:0 0 28px; color:#626975; font-size:14px; line-height:23px; overflow-wrap:anywhere; word-break:break-word;">${escapeHtml(params.shippingAddress).replace(/\r\n|\r|\n/g, "<br />")}</p>
          ${orderUrl ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; margin:0 0 12px;">
            <tr><td align="center" bgcolor="#d62b23" style="background-color:#d62b23; border-radius:6px; mso-padding-alt:16px 24px;">
              <a href="${escapeHtml(orderUrl)}" style="display:block; padding:16px 24px; border:1px solid #d62b23; border-radius:6px; color:#ffffff; font-size:14px; font-weight:bold; line-height:20px; text-align:center; text-decoration:none;">View your order</a>
            </td></tr>
          </table>
          <p style="margin:0 0 28px; color:#626975; font-size:12px; line-height:20px; text-align:center;">Sign in to your Key Lanka account to view your order.</p>` : ""}

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; border-top:1px solid #e5e7eb;">
            <tr><td style="padding:24px 0 0;">
              <p style="margin:0 0 6px; color:#202632; font-size:14px; font-weight:bold; line-height:22px;">Need help with your order?</p>
              <p style="margin:0; color:#626975; font-size:13px; line-height:22px;">Email <a href="mailto:info@keylanka.lk" style="color:#b5221c; text-decoration:underline;">info@keylanka.lk</a> or call <a href="tel:+94112812789" style="color:#b5221c; text-decoration:underline; white-space:nowrap;">011 2 812 789</a>. Please quote your order number.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="email-footer" align="center" style="padding:28px 24px;">
          <p style="margin:0 0 8px; color:#555e6b; font-size:12px; font-weight:bold; line-height:20px;">KEY LANKA</p>
          <p style="margin:0 0 8px; color:#626975; font-size:12px; line-height:20px;">No. 620, High Level Road,<br />Wijerama, Nugegoda, Sri Lanka</p>
          <p style="margin:0 0 12px; color:#626975; font-size:12px; line-height:22px;"><a href="tel:+94765662666" style="color:#626975; text-decoration:underline; white-space:nowrap;">076 5 662 666</a> &nbsp;&middot;&nbsp; <a href="tel:+94777777678" style="color:#626975; text-decoration:underline; white-space:nowrap;">077 7 777 678</a></p>
          <p style="margin:0; color:#626975; font-size:11px; line-height:18px;">You're receiving this email because you placed an order with Key Lanka.</p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
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
