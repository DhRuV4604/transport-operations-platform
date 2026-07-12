import { NextResponse } from "next/server";
import { sendLicenseReminders } from "@/server/services/licenseReminderService";

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await sendLicenseReminders();
  return NextResponse.json(result);
}
