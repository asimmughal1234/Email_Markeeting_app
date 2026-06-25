import { NextResponse } from "next/server";
import { buildPreviewFromWorkbook, readWorkbook } from "@/lib/excel";
import { getAttachments, getExcelBuffer, parseCampaignConfig } from "@/lib/form";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const config = parseCampaignConfig(formData);
    const excelBuffer = await getExcelBuffer(formData);
    const attachments = await getAttachments(formData);
    const workbook = readWorkbook(excelBuffer);

    const result = buildPreviewFromWorkbook({
      workbook,
      config: { ...config, sendMode: "dry-run" },
      attachmentNames: attachments.map((attachment) => attachment.filename),
      maxPreview: 30,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown preview error",
      },
      { status: 400 },
    );
  }
}
