import * as XLSX from "xlsx";
import type {
  CampaignConfig,
  CampaignSummary,
  EmailPreview,
  SendLogItem,
  TrackingColumns,
} from "./types";

export const DEFAULT_TRACKING_COLUMNS: TrackingColumns = {
  subject: "email_subject",
  message: "email_message",
  status: "email_status",
  sentAt: "email_sent_at",
  error: "email_error",
  sentEmails: "sent_emails",
  campaignName: "campaign_name",
};

const SENDABLE_STATUSES = new Set(["", "pending", "failed", "partial"]);

export function normalizeHeader(header: string): string {
  return String(header || "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeKey(header: string): string {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\(s\)/g, "s")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function clean(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function splitEmails(value: string): string[] {
  const found = clean(value).match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g) || [];
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const email of found) {
    const lower = email.toLowerCase().trim();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(lower);
    }
  }

  return unique;
}

export function isValidEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email);
}

export function personalize(template: string, data: Record<string, string>, recipientEmail: string): string {
  const merged = {
    ...data,
    email: recipientEmail,
  };

  return template.replace(/\{([^{}]+)\}/g, (full, key) => {
    const normalizedKey = normalizeKey(key);
    return Object.prototype.hasOwnProperty.call(merged, normalizedKey) ? merged[normalizedKey] : full;
  });
}

export function readWorkbook(buffer: Buffer): XLSX.WorkBook {
  return XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: false,
  });
}

export function getWorksheetData(workbook: XLSX.WorkBook, requestedSheet?: string) {
  const selectedSheet = requestedSheet && workbook.SheetNames.includes(requestedSheet)
    ? requestedSheet
    : workbook.SheetNames[0];

  if (!selectedSheet) {
    throw new Error("The uploaded workbook does not contain any sheet.");
  }

  const worksheet = workbook.Sheets[selectedSheet];
  const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (rows.length === 0) {
    throw new Error("The selected sheet is empty.");
  }

  const headers = rows[0].map((header) => clean(header));
  return { selectedSheet, worksheet, rows, headers };
}

export function buildHeaderMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();

  headers.forEach((header, index) => {
    if (header) map.set(normalizeHeader(header), index);
  });

  return map;
}

export function ensureColumn(headers: string[], rows: string[][], headerName: string): number {
  const map = buildHeaderMap(headers);
  const normalized = normalizeHeader(headerName);

  if (map.has(normalized)) {
    return map.get(normalized)!;
  }

  headers.push(headerName);
  rows[0] = headers;

  for (let i = 1; i < rows.length; i += 1) {
    rows[i].push("");
  }

  return headers.length - 1;
}

export function ensureTrackingColumns(headers: string[], rows: string[][], tracking: TrackingColumns): Record<keyof TrackingColumns, number> {
  return {
    subject: ensureColumn(headers, rows, tracking.subject),
    message: ensureColumn(headers, rows, tracking.message),
    status: ensureColumn(headers, rows, tracking.status),
    sentAt: ensureColumn(headers, rows, tracking.sentAt),
    error: ensureColumn(headers, rows, tracking.error),
    sentEmails: ensureColumn(headers, rows, tracking.sentEmails),
    campaignName: ensureColumn(headers, rows, tracking.campaignName),
  };
}

function findSourceColumn(headers: string[], excelColumnName: string, fallback: string): number {
  const map = buildHeaderMap(headers);
  const wanted = normalizeHeader(excelColumnName || fallback);

  if (!map.has(wanted)) {
    throw new Error(`Required Excel column not found: ${excelColumnName || fallback}`);
  }

  return map.get(wanted)!;
}

export function buildRowData(headers: string[], row: string[], config: CampaignConfig): Record<string, string> {
  const data: Record<string, string> = {};

  headers.forEach((header, index) => {
    const key = normalizeKey(header);
    if (key) data[key] = clean(row[index]);
  });

  const headerMap = buildHeaderMap(headers);

  Object.entries(config.columnMapping || {}).forEach(([logicalKey, excelHeader]) => {
    const index = headerMap.get(normalizeHeader(excelHeader));
    if (index !== undefined) {
      data[normalizeKey(logicalKey)] = clean(row[index]);
    }
  });

  if (data.business_name) {
    data.name = data.business_name;
    data.company = data.business_name;
  }

  return data;
}

export function collectPreviouslySentEmails(rows: string[][], trackingIndexes: Record<keyof TrackingColumns, number>): Set<string> {
  const sent = new Set<string>();

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const status = clean(row[trackingIndexes.status]).toLowerCase();
    const sentEmails = clean(row[trackingIndexes.sentEmails]);

    if ((status === "sent" || status === "partial") && sentEmails) {
      for (const email of splitEmails(sentEmails)) {
        sent.add(email);
      }
    }
  }

  return sent;
}

export function buildPreviewFromWorkbook(params: {
  workbook: XLSX.WorkBook;
  config: CampaignConfig;
  attachmentNames: string[];
  maxPreview?: number;
}) {
  const { workbook, config, attachmentNames, maxPreview = 25 } = params;

  const { selectedSheet, rows, headers } = getWorksheetData(workbook, config.sheetName);
  const trackingIndexes = ensureTrackingColumns(headers, rows, config.trackingColumns);
  const emailCol = findSourceColumn(headers, config.columnMapping.email, "Email(s)");
  const businessCol = findSourceColumn(headers, config.columnMapping.business_name, "Business Name");

  const alreadySent = collectPreviouslySentEmails(rows, trackingIndexes);
  const currentRun = new Set<string>();

  const previews: EmailPreview[] = [];
  let validEmails = 0;
  let skippedRows = 0;
  let duplicateEmails = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const rowNumber = i + 1;
    const businessName = clean(row[businessCol]);
    const status = clean(row[trackingIndexes.status]).toLowerCase();

    if (!SENDABLE_STATUSES.has(status)) {
      skippedRows += 1;
      continue;
    }

    const emails = splitEmails(clean(row[emailCol]));

    if (emails.length === 0) {
      skippedRows += 1;
      if (previews.length < maxPreview) {
        previews.push({
          rowNumber,
          businessName,
          to: "",
          subject: "",
          body: "",
          status: "skipped",
          reason: "No valid email in mapped email column.",
        });
      }
      continue;
    }

    const rowData = buildRowData(headers, row, config);
    const rowSubject = clean(row[trackingIndexes.subject]) || config.subjectTemplate;
    const rowMessage = clean(row[trackingIndexes.message]) || config.bodyTemplate;

    for (const email of emails) {
      if (alreadySent.has(email) || currentRun.has(email)) {
        duplicateEmails += 1;
        if (previews.length < maxPreview) {
          previews.push({
            rowNumber,
            businessName,
            to: email,
            subject: "",
            body: "",
            status: "duplicate",
            reason: "Duplicate or already sent email.",
          });
        }
        continue;
      }

      currentRun.add(email);
      validEmails += 1;

      if (previews.length < maxPreview) {
        let body = personalize(rowMessage, rowData, email);
        if (config.unsubscribeText) {
          body += `\n\n---\n${config.unsubscribeText}`;
        }

        previews.push({
          rowNumber,
          businessName,
          to: email,
          subject: personalize(rowSubject, rowData, email),
          body,
          status: "ready",
        });
      }
    }
  }

  const summary: CampaignSummary = {
    totalRows: Math.max(rows.length - 1, 0),
    validEmails,
    skippedRows,
    duplicateEmails,
    alreadySentEmails: alreadySent.size,
    selectedSheet,
    mode: config.sendMode,
    attachments: attachmentNames,
  };

  return { summary, previews };
}

export function workbookToBase64(workbook: XLSX.WorkBook): string {
  const output = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return Buffer.from(output).toString("base64");
}

export function replaceSheetFromRows(workbook: XLSX.WorkBook, sheetName: string, rows: string[][]): void {
  workbook.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(rows);
}

export async function wait(seconds: number): Promise<void> {
  if (seconds <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

export async function processSendBatch(params: {
  workbook: XLSX.WorkBook;
  config: CampaignConfig;
  attachments: { filename: string; content: Buffer; contentType?: string }[];
  sendFn: (input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments: { filename: string; content: Buffer; contentType?: string }[];
  }) => Promise<void>;
}) {
  const { workbook, config, attachments, sendFn } = params;

  const { selectedSheet, rows, headers } = getWorksheetData(workbook, config.sheetName);
  const trackingIndexes = ensureTrackingColumns(headers, rows, config.trackingColumns);
  const emailCol = findSourceColumn(headers, config.columnMapping.email, "Email(s)");
  const businessCol = findSourceColumn(headers, config.columnMapping.business_name, "Business Name");

  const alreadyProcessed = collectPreviouslySentEmails(rows, trackingIndexes);
  const logs: SendLogItem[] = [];
  let sentCount = 0;

  for (let i = 1; i < rows.length; i += 1) {
    if (sentCount >= config.dailyLimit) break;

    const row = rows[i];
    const rowNumber = i + 1;
    const businessName = clean(row[businessCol]);
    const status = clean(row[trackingIndexes.status]).toLowerCase();

    if (!SENDABLE_STATUSES.has(status)) {
      logs.push({
        rowNumber,
        businessName,
        email: "",
        status: "skipped",
        message: `Skipped because current status is "${status || "blank"}".`,
      });
      continue;
    }

    const emails = splitEmails(clean(row[emailCol]));
    if (emails.length === 0) {
      row[trackingIndexes.status] = "skipped";
      row[trackingIndexes.error] = "No valid email found in mapped email column.";
      row[trackingIndexes.campaignName] = config.campaignName;

      logs.push({
        rowNumber,
        businessName,
        email: "",
        status: "skipped",
        message: "No valid email found.",
      });
      continue;
    }

    const rowData = buildRowData(headers, row, config);
    const rowSubject = clean(row[trackingIndexes.subject]) || config.subjectTemplate;
    const rowMessage = clean(row[trackingIndexes.message]) || config.bodyTemplate;

    const successes: string[] = [];
    const failures: string[] = [];
    const duplicates: string[] = [];

    for (const email of emails) {
      if (sentCount >= config.dailyLimit) break;

      if (alreadyProcessed.has(email)) {
        duplicates.push(email);
        logs.push({
          rowNumber,
          businessName,
          email,
          status: "skipped",
          message: "Duplicate or already sent email.",
        });
        continue;
      }

      if (!isValidEmail(email)) {
        failures.push(`${email}: Invalid email format`);
        logs.push({
          rowNumber,
          businessName,
          email,
          status: "failed",
          message: "Invalid email format.",
        });
        continue;
      }

      const subject = personalize(rowSubject, rowData, email);
      let body = personalize(rowMessage, rowData, email);

      if (config.unsubscribeText) {
        body += `\n\n---\n${config.unsubscribeText}`;
      }

      const html = config.useHtml && config.htmlTemplate
        ? personalize(config.htmlTemplate, rowData, email)
        : undefined;

      try {
        await sendFn({
          to: email,
          subject,
          text: body,
          html,
          attachments,
        });

        sentCount += 1;
        successes.push(email);
        alreadyProcessed.add(email);

        logs.push({
          rowNumber,
          businessName,
          email,
          status: "sent",
          message: "Email sent successfully.",
        });

        if (config.delaySeconds > 0) {
          await wait(config.delaySeconds);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown send error";
        failures.push(`${email}: ${message}`);

        logs.push({
          rowNumber,
          businessName,
          email,
          status: "failed",
          message,
        });
      }
    }

    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    if (successes.length > 0 && failures.length === 0) {
      row[trackingIndexes.status] = "sent";
      row[trackingIndexes.sentAt] = now;
      row[trackingIndexes.error] = "";
      row[trackingIndexes.sentEmails] = successes.join("; ");
      row[trackingIndexes.campaignName] = config.campaignName;
    } else if (successes.length > 0 && failures.length > 0) {
      row[trackingIndexes.status] = "partial";
      row[trackingIndexes.sentAt] = now;
      row[trackingIndexes.error] = failures.join(" | ").slice(0, 500);
      row[trackingIndexes.sentEmails] = successes.join("; ");
      row[trackingIndexes.campaignName] = config.campaignName;
    } else if (failures.length > 0) {
      row[trackingIndexes.status] = "failed";
      row[trackingIndexes.error] = failures.join(" | ").slice(0, 500);
      row[trackingIndexes.campaignName] = config.campaignName;
    } else if (duplicates.length > 0) {
      row[trackingIndexes.status] = "skipped";
      row[trackingIndexes.error] = `Duplicate or already processed email(s): ${duplicates.join("; ")}`.slice(0, 500);
      row[trackingIndexes.campaignName] = config.campaignName;
    }
  }

  replaceSheetFromRows(workbook, selectedSheet, rows);

  return {
    logs,
    updatedWorkbookBase64: workbookToBase64(workbook),
    downloadFileName: `updated-${selectedSheet.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now()}.xlsx`,
  };
}

export async function processTestEmail(params: {
  workbook: XLSX.WorkBook;
  config: CampaignConfig;
  attachments: { filename: string; content: Buffer; contentType?: string }[];
  sendFn: (input: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    attachments: { filename: string; content: Buffer; contentType?: string }[];
  }) => Promise<void>;
}) {
  const { workbook, config, attachments, sendFn } = params;
  const testEmail = clean(config.testEmail);

  if (!testEmail || !isValidEmail(testEmail)) {
    throw new Error("Please enter a valid test email address.");
  }

  const { previews } = buildPreviewFromWorkbook({
    workbook,
    config: { ...config, sendMode: "dry-run" },
    attachmentNames: attachments.map((attachment) => attachment.filename),
    maxPreview: 500,
  });

  const firstReady = previews.find((preview) => preview.status === "ready");

  if (!firstReady) {
    throw new Error("No eligible lead found to use for the test email.");
  }

  await sendFn({
    to: testEmail,
    subject: `[TEST] ${firstReady.subject}`,
    text: `This is a test email.\nOriginal recipient would be: ${firstReady.to}\n\n${firstReady.body}`,
    attachments,
  });

  const logs: SendLogItem[] = [
    {
      rowNumber: firstReady.rowNumber,
      businessName: firstReady.businessName,
      email: testEmail,
      status: "test-sent",
      message: `Test email sent. Original recipient would be ${firstReady.to}.`,
    },
  ];

  return { logs };
}
