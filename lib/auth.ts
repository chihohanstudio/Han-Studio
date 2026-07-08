import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getFrontendPreviewProfile } from "@/lib/preview";
import type { Profile } from "@/lib/types";

export const ADMIN_EMAILS = ["chihan@iu.edu", "zhouding@iu.edu"] as const;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(normalizeEmail(email) as (typeof ADMIN_EMAILS)[number]);
}

export function isStudentEmail(email: string) {
  return normalizeEmail(email).endsWith("@iu.edu");
}

export async function getCurrentProfile() {
  const previewProfile = getFrontendPreviewProfile();

  if (previewProfile) {
    return {
      user: {
        id: previewProfile.id,
        email: previewProfile.email
      },
      profile: previewProfile
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,status,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return { user, profile: profile as Profile | null };
}

export async function requireProfile() {
  const current = await getCurrentProfile();

  if (!current.user) {
    redirect("/login");
  }

  if (!current.profile) {
    redirect("/login?error=not_allowed");
  }

  if (current.profile.status !== "active") {
    redirect("/login?error=archived");
  }

  return current as Awaited<ReturnType<typeof getCurrentProfile>> & {
    user: NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>["user"]>;
    profile: Profile;
  };
}

export async function requireAdmin() {
  const current = await requireProfile();

  if (current.profile.role !== "admin") {
    redirect("/student/dashboard?error=admin_required");
  }

  return current;
}

export async function requireStudent() {
  const current = await requireProfile();

  if (current.profile.role !== "student") {
    redirect("/admin/dashboard?error=student_required");
  }

  return current;
}

export async function ensureProfileForAuthenticatedUser(userId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const admin = createSupabaseAdminClient();

  if (!isStudentEmail(normalizedEmail)) {
    throw new Error("Only @iu.edu email addresses can access the studio site.");
  }

  const { data: existing, error: existingError } = await admin
    .from("profiles")
    .select("id,full_name,email,role,status,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing as Profile;
  }

  const { data: invitation, error: invitationError } = await admin
    .from("invitations")
    .select("id,email,full_name,role,status,expires_at")
    .eq("email", normalizedEmail)
    .in("status", ["pending", "accepted"])
    .maybeSingle();

  if (invitationError) {
    throw invitationError;
  }

  if (!invitation) {
    throw new Error("This email has not been invited to the studio site.");
  }

  if (invitation.expires_at && new Date(invitation.expires_at) <= new Date()) {
    await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
    throw new Error("This invitation has expired.");
  }

  const { data, error } = await admin
    .from("profiles")
    .insert({
      id: userId,
      email: normalizedEmail,
      full_name: invitation.full_name,
      role: invitation.role,
      status: "active"
    })
    .select("id,full_name,email,role,status,created_at,updated_at")
    .single();

  if (error) {
    throw error;
  }

  await admin
    .from("invitations")
    .update({
      status: "accepted",
      accepted_by: userId,
      accepted_at: new Date().toISOString()
    })
    .eq("id", invitation.id);

  return data as Profile;
}
