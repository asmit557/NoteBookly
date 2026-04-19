import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

// Lazily created so the module can be imported without crashing when env vars
// are missing (e.g. during `next build` on Vercel before secrets are set).
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (16 chars)
    },
  });

  return _transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Send a transactional email via Gmail SMTP (Nodemailer).
 * Gracefully no-ops if credentials are not configured.
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] Gmail credentials not configured — email skipped");
    return;
  }

  const html = await render(react);

  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM ?? `NoteBookly <${process.env.GMAIL_USER}>`,
    replyTo: process.env.EMAIL_REPLY_TO,
    to,
    subject,
    html,
  });
}
