import type { CampaignConfig, SenderSettings, TrackingColumns } from "./types";
import { DEFAULT_TRACKING_COLUMNS } from "./excel";

const DEFAULT_COLUMN_MAPPING = {
  business_name: "Business Name",
  email: "Email(s)",
  phone_number: "Phone Number",
  website: "Website",
  city: "City",
  rating: "Rating",
  number_of_reviews: "Number of Reviews",
  category: "Category",
  google_maps_url: "Google Maps URL",
};

function parseJsonObject<T extends object>(raw: FormDataEntryValue | null, fallback: T): T {
  if (!raw || typeof raw !== "string") return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ...fallback, ...parsed };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function toPositiveNumber(value: FormDataEntryValue | null, fallback: number, max: number): number {
  const parsed = Number(value || fallback);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export function parseCampaignConfig(formData: FormData): CampaignConfig {
  const columnMapping = parseJsonObject(formData.get("columnMapping"), DEFAULT_COLUMN_MAPPING);
  const trackingColumns = parseJsonObject<TrackingColumns>(formData.get("trackingColumns"), DEFAULT_TRACKING_COLUMNS);

  const sendMode = String(formData.get("sendMode") || "dry-run");
  const safeMode = ["dry-run", "test-one", "send-batch"].includes(sendMode)
    ? (sendMode as CampaignConfig["sendMode"])
    : "dry-run";

  return {
    sheetName: String(formData.get("sheetName") || "").trim(),
    campaignName: String(formData.get("campaignName") || "Untitled Campaign").trim(),
    sendMode: safeMode,
    dailyLimit: toPositiveNumber(formData.get("dailyLimit"), 10, 100),
    delaySeconds: toPositiveNumber(formData.get("delaySeconds"), 1, 10),
    testEmail: String(formData.get("testEmail") || "").trim(),
    subjectTemplate: String(formData.get("subjectTemplate") || "AI Automation Solutions for Real Estate Businesses"),
    bodyTemplate: String(formData.get("bodyTemplate") || ""),
    htmlTemplate: String(formData.get("htmlTemplate") || ""),
    useHtml: String(formData.get("useHtml") || "false") === "true",
    unsubscribeText: String(formData.get("unsubscribeText") || "").trim(),
    columnMapping,
    trackingColumns,
  };
}


export function parseSenderSettings(formData: FormData): SenderSettings {
  return {
    senderEmail: String(formData.get("senderEmail") || "").trim(),
    senderAppPassword: String(formData.get("senderAppPassword") || "").trim(),
    senderName: String(formData.get("senderName") || "Email Marketing Automation").trim(),
    smtpHost: String(formData.get("smtpHost") || "smtp.gmail.com").trim(),
    smtpPort: Number(formData.get("smtpPort") || "465"),
    replyTo: String(formData.get("replyTo") || "").trim(),
  };
}

export async function getExcelBuffer(formData: FormData): Promise<Buffer> {
  const excelFile = formData.get("excelFile");

  if (!(excelFile instanceof File)) {
    throw new Error("Please upload an Excel .xlsx file.");
  }

  if (!excelFile.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Only .xlsx files are supported.");
  }

  return Buffer.from(await excelFile.arrayBuffer());
}

export async function getAttachments(formData: FormData) {
  const maxMb = Number(process.env.MAX_ATTACHMENT_MB || "10");
  const maxBytes = maxMb * 1024 * 1024;
  const files = formData.getAll("attachments");
  const attachments: { filename: string; content: Buffer; contentType?: string }[] = [];

  let totalBytes = 0;

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    totalBytes += file.size;

    if (totalBytes > maxBytes) {
      throw new Error(`Total attachment size is too large. Limit is ${maxMb}MB.`);
    }

    attachments.push({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || undefined,
    });
  }

  return attachments;
}
