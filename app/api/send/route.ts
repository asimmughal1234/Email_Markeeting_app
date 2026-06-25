import { NextResponse } from "next/server";
import { processSendBatch, processTestEmail, readWorkbook } from "@/lib/excel";
import { sendMail } from "@/lib/email";
import { getAttachments, getExcelBuffer, parseCampaignConfig, parseSenderSettings } from "@/lib/form";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const config = parseCampaignConfig(formData);
    const senderSettings = parseSenderSettings(formData);
    const excelBuffer = await getExcelBuffer(formData);
    const attachments = await getAttachments(formData);
    const workbook = readWorkbook(excelBuffer);

    if (config.sendMode === "dry-run") {
      return NextResponse.json(
        {
          ok: false,
          error: "Use the Preview button for dry-run mode.",
        },
        { status: 400 },
      );
    }

    if (config.sendMode === "test-one") {
      const result = await processTestEmail({
        workbook,
        config,
        attachments,
        sendFn: (input) =>
          sendMail(
            {
              ...input,
              replyTo: senderSettings.replyTo || process.env.DEFAULT_REPLY_TO || undefined,
            },
            senderSettings,
          ),
      });

      return NextResponse.json({
        ok: true,
        mode: "test-one",
        ...result,
      });
    }

    const result = await processSendBatch({
      workbook,
      config,
      attachments,
      sendFn: (input) =>
        sendMail({
          ...input,
          replyTo: process.env.DEFAULT_REPLY_TO || undefined,
        }),
    });

    return NextResponse.json({
      ok: true,
      mode: "send-batch",
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown send error",
      },
      { status: 400 },
    );
  }
}
