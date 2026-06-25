export type SendMode = "dry-run" | "test-one" | "send-batch";

export type ColumnMapping = Record<string, string>;

export interface TrackingColumns {
  subject: string;
  message: string;
  status: string;
  sentAt: string;
  error: string;
  sentEmails: string;
  campaignName: string;
}

export interface CampaignConfig {
  sheetName?: string;
  campaignName: string;
  sendMode: SendMode;
  dailyLimit: number;
  delaySeconds: number;
  testEmail?: string;
  subjectTemplate: string;
  bodyTemplate: string;
  htmlTemplate?: string;
  useHtml: boolean;
  unsubscribeText: string;
  columnMapping: ColumnMapping;
  trackingColumns: TrackingColumns;
}

export interface EmailPreview {
  rowNumber: number;
  businessName: string;
  to: string;
  subject: string;
  body: string;
  status: "ready" | "skipped" | "duplicate" | "invalid";
  reason?: string;
}

export interface SendLogItem {
  rowNumber: number;
  businessName: string;
  email: string;
  status: "sent" | "skipped" | "failed" | "test-sent";
  message: string;
}

export interface CampaignSummary {
  totalRows: number;
  validEmails: number;
  skippedRows: number;
  duplicateEmails: number;
  alreadySentEmails: number;
  selectedSheet: string;
  mode: SendMode;
  attachments: string[];
}


export interface SenderSettings {
  senderEmail: string;
  senderAppPassword: string;
  senderName: string;
  smtpHost: string;
  smtpPort: number;
  replyTo?: string;
}
