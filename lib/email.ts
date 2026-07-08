import { ADMIN_EMAILS } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      ...payload
    })
  });

  if (!response.ok) {
    console.error("Email notification failed", await response.text());
  }
}

export async function notifyAdmins(subject: string, html: string) {
  await sendEmail({
    to: [...ADMIN_EMAILS],
    subject,
    html
  });
}

export async function notifyActiveStudents(subject: string, html: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("role", "student")
    .eq("status", "active");

  if (error) {
    throw error;
  }

  const emails = (data ?? []).map((profile) => profile.email).filter(Boolean);
  if (emails.length === 0) {
    return;
  }

  await sendEmail({
    to: emails,
    subject,
    html
  });
}
