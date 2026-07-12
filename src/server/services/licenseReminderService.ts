import "server-only";
import nodemailer from "nodemailer";
import type { Driver } from "@prisma/client";
import { db } from "@/lib/db";
import { getExpiringLicenses } from "@/server/services/driverService";

const REMIND_COOLDOWN_HOURS = 24;

let cachedTransporter: nodemailer.Transporter | null = null;

// Demo fallback: without SMTP_HOST configured, spin up a disposable Ethereal inbox
// so reminders can be sent end-to-end. Preview links are returned to the caller.
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.SMTP_HOST) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
  return cachedTransporter;
}

function licenseEmailBody(drivers: Driver[]) {
  const rows = drivers
    .map((d) => {
      const days = Math.ceil((d.licenseExpiry.getTime() - Date.now()) / 86_400_000);
      const status = days < 0 ? `expired ${Math.abs(days)}d ago` : `expires in ${days}d`;
      return `- ${d.name} (${d.licenseNumber}, ${d.licenseCategory}) — ${status}`;
    })
    .join("\n");
  return `The following driver licenses need attention:\n\n${rows}\n`;
}

export type LicenseReminderResult = {
  sent: number;
  recipients: number;
  skipped: number;
  previewUrls: string[];
};

/** Emails every Safety Officer one summary of expiring/expired licenses, skipping drivers reminded in the last 24h. */
export async function sendLicenseReminders(): Promise<LicenseReminderResult> {
  const drivers = await getExpiringLicenses();
  const cooldownCutoff = new Date(Date.now() - REMIND_COOLDOWN_HOURS * 60 * 60 * 1000);
  const due = drivers.filter((d) => !d.lastRemindedAt || d.lastRemindedAt < cooldownCutoff);

  if (due.length === 0) {
    return { sent: 0, recipients: 0, skipped: drivers.length, previewUrls: [] };
  }

  const officers = await db.user.findMany({ where: { role: "SAFETY_OFFICER" } });
  if (officers.length === 0) {
    return { sent: 0, recipients: 0, skipped: due.length, previewUrls: [] };
  }

  const transporter = await getTransporter();
  const body = licenseEmailBody(due);
  const previewUrls: string[] = [];

  for (const officer of officers) {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "TransitOps <noreply@transitops.local>",
      to: officer.email,
      subject: `License reminder: ${due.length} driver(s) need attention`,
      text: body,
    });
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) previewUrls.push(preview);
  }

  await db.driver.updateMany({
    where: { id: { in: due.map((d) => d.id) } },
    data: { lastRemindedAt: new Date() },
  });

  return {
    sent: due.length,
    recipients: officers.length,
    skipped: drivers.length - due.length,
    previewUrls,
  };
}
