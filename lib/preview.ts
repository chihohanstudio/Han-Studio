import { cookies } from "next/headers";
import type { Profile, Role } from "@/lib/types";

export const FRONTEND_PREVIEW_COOKIE = "studio_frontend_preview_role";

export const PREVIEW_ADMIN_PROFILE: Profile = {
  id: "10000000-0000-0000-0000-000000000001",
  full_name: "Chi Ho Han",
  email: "chihan@iu.edu",
  role: "admin",
  status: "active",
  created_at: "2026-07-01T12:00:00.000Z",
  updated_at: "2026-07-01T12:00:00.000Z"
};

export const PREVIEW_STUDENT_PROFILE: Profile = {
  id: "20000000-0000-0000-0000-000000000001",
  full_name: "Ding Zhou",
  email: "zhouding@iu.edu",
  role: "student",
  status: "active",
  created_at: "2026-07-01T12:00:00.000Z",
  updated_at: "2026-07-01T12:00:00.000Z"
};

export function isFrontendPreviewEnabled() {
  return process.env.NEXT_PUBLIC_FRONTEND_PREVIEW === "true" || process.env.NODE_ENV !== "production";
}

export function getFrontendPreviewRole() {
  if (!isFrontendPreviewEnabled()) {
    return null;
  }

  const role = cookies().get(FRONTEND_PREVIEW_COOKIE)?.value;
  return role === "admin" || role === "student" ? role : null;
}

export function isFrontendPreviewActive() {
  return Boolean(getFrontendPreviewRole());
}

export function getFrontendPreviewProfile() {
  const role = getFrontendPreviewRole();

  if (role === "admin") {
    return PREVIEW_ADMIN_PROFILE;
  }

  if (role === "student") {
    return PREVIEW_STUDENT_PROFILE;
  }

  return null;
}

export function previewHomeForRole(role: Role) {
  return role === "admin" ? "/admin/dashboard" : "/student/dashboard";
}
