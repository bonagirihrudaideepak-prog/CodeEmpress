// EMAIL SENDING (Module 1 — Authentication).
// Two modes:
//  - If SMTP_* env vars are configured (optional), send via Nodemailer.
//  - Otherwise, log the email to the console and persist it to Codempress's
//    own in-app "Mailbox" so the flow is fully testable in the sandbox with
//    no external SMTP server.
import { createTransport } from "nodemailer";
import { db } from "./db";

export type OutboundMail = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const SMTP_CONFIGURED = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
);

const FROM = process.env.SMTP_FROM || "Codempress <no-reply@codempress.local>";

async function sendViaSmtp(mail: OutboundMail) {
  const transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: FROM, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
}

// Persist the mail to the in-app mailbox so the sandbox UI can read it even
// when no real SMTP is configured.
async function logToMailbox(mail: OutboundMail) {
  try {
    await db.mail.create({
      data: {
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      },
    });
  } catch (e) {
    // non-fatal — mailbox table may not exist in a trimmed env
  }
  console.log(`\n📧 [Codempress Mail →] ${mail.to}\n   Subject: ${mail.subject}\n   ${mail.text}\n`);
}

export async function sendMail(mail: OutboundMail) {
  if (SMTP_CONFIGURED) {
    try {
      await sendViaSmtp(mail);
      return { delivered: true, via: "smtp" };
    } catch (e) {
      console.error("SMTP send failed; falling back to mailbox:", e);
    }
  }
  await logToMailbox(mail);
  return { delivered: true, via: "sandbox-mailbox" };
}

// Build a small, branded HTML email.
export function mailHtml(title: string, bodyHtml: string, cta: { label: string; url: string }) {
  const ctaHtml = cta
    ? `<a href="${cta.url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">${cta.label}</a>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#0b0f14;padding:24px;font-family:system-ui,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
  <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#0f1620;border:1px solid #1e293b;border-radius:16px;padding:32px">
    <tr><td style="padding:24px 32px 0">
      <div style="font-size:22px;font-weight:800;color:#e2e8f0">⚒️ <span style="color:#38bdf8">Codempress</span></div>
      <h1 style="color:#f1f5f9;font-size:18px;margin:18px 0 4px">${title}</h1>
      <div style="color:#94a3b8;font-size:14px;line-height:1.6">${bodyHtml}</div>
      ${ctaHtml}
      <p style="color:#64748b;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
    </td></tr>
  </table>
  </td></tr></table></body></html>`;
}
