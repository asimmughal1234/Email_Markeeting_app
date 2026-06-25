import nodemailer from "nodemailer";
import type { SenderSettings } from "./types";

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
  replyTo?: string;
}

function clean(value: string | undefined | null): string {
  return String(value || "").trim();
}

function requiredValue(value: string, label: string): string {
  if (!value) {
    throw new Error(`${label} is required. Please add sender Gmail and App Password before sending.`);
  }

  return value;
}

export async function sendMail(input: SendMailInput, senderSettings?: Partial<SenderSettings>): Promise<void> {
  const senderEmail = requiredValue(
    clean(senderSettings?.senderEmail) || clean(process.env.GMAIL_EMAIL),
    "Sender Gmail",
  );

  const senderAppPassword = requiredValue(
    clean(senderSettings?.senderAppPassword) || clean(process.env.GMAIL_APP_PASSWORD),
    "Gmail App Password",
  );

  const senderName =
    clean(senderSettings?.senderName) ||
    clean(process.env.EMAIL_SENDER_NAME) ||
    "Email Marketing Automation";

  const smtpHost =
    clean(senderSettings?.smtpHost) ||
    clean(process.env.SMTP_HOST) ||
    "smtp.gmail.com";

  const smtpPort = Number(senderSettings?.smtpPort || process.env.SMTP_PORT || "465");

  const replyTo =
    clean(input.replyTo) ||
    clean(senderSettings?.replyTo) ||
    clean(process.env.DEFAULT_REPLY_TO) ||
    undefined;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: senderEmail,
      pass: senderAppPassword,
    },
  });

  await transporter.sendMail({
    from: `${senderName} <${senderEmail}>`,
    to: input.to,
    replyTo,
    subject: input.subject,
    text: input.text,
    html: input.html,
    attachments: input.attachments,
  });
}
