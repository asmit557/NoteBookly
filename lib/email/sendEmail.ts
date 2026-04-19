import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Send a transactional email via Resend.
 * Gracefully no-ops if RESEND_API_KEY is not configured.
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured — email skipped");
    return;
  }

  const html = await render(react);

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "NoteBookly <onboarding@resend.dev>",
    reply_to: process.env.EMAIL_REPLY_TO,   // optional — your personal email
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend send error: ${JSON.stringify(error)}`);
  }
}
