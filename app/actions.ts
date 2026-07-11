"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  isStudentEmail,
  normalizeEmail,
  ensureProfileForAuthenticatedUser,
  requireAdmin,
  requireProfile,
  requireStudent
} from "@/lib/auth";
import { formatDateTime, zonedDateAndTimeToUtcIso, zonedDateTimeToUtcIso } from "@/lib/datetime";
import { getCurrentSemester } from "@/lib/data";
import {
  FRONTEND_PREVIEW_COOKIE,
  isFrontendPreviewActive,
  isFrontendPreviewEnabled,
  previewHomeForRole
} from "@/lib/preview";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getSiteUrl,
  hasRealSupabaseConfig
} from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string) {
  const value = text(formData, key);
  return value.length > 0 ? value : null;
}

function optionalInt(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function redirectPath(formData: FormData, fallback: string) {
  const next = text(formData, "next");
  return next.startsWith("/") ? next : fallback;
}

function withMessage(path: string, type: "success" | "error", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${path}?${params.toString()}`);
}

function completePreviewAction(path: string, message: string): never | undefined {
  if (isFrontendPreviewActive()) {
    revalidatePath("/", "layout");
    withMessage(path, "success", `Preview: ${message}`);
  }
}

export async function startFrontendPreview(formData: FormData) {
  if (!isFrontendPreviewEnabled()) {
    withMessage("/login", "error", "Frontend preview mode is disabled.");
  }

  const role = text(formData, "role") as Role;

  if (role !== "admin" && role !== "student") {
    withMessage("/login", "error", "Choose an admin or student preview.");
  }

  cookies().set(FRONTEND_PREVIEW_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  withMessage(previewHomeForRole(role), "success", `${role === "admin" ? "Admin" : "Student"} preview started.`);
}

export async function signInWithPassword(formData: FormData) {
  const email = normalizeEmail(text(formData, "email"));
  const password = String(formData.get("password") ?? "");

  if (!email) {
    withMessage("/login", "error", "Enter your IU email address.");
  }

  if (!password) {
    withMessage("/login", "error", "Enter your password.");
  }

  if (!isStudentEmail(email)) {
    withMessage("/login", "error", "Only @iu.edu email addresses can access this studio site.");
  }

  if (!hasRealSupabaseConfig()) {
    withMessage("/login", "error", "Supabase is not connected yet. Use preview access for frontend work.");
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error("Supabase password sign-in failed", error);
    const message = /email not confirmed/i.test(error.message)
      ? "Complete the invitation email and set a password before signing in."
      : "Email or password is incorrect.";
    withMessage("/login", "error", message);
  }

  if (!user?.email) {
    withMessage("/login", "error", "Could not complete sign in. Try again.");
  }

  let profile;
  try {
    profile = await ensureProfileForAuthenticatedUser(user.id, user.email);
  } catch (profileError) {
    await supabase.auth.signOut();
    console.error("Studio profile check failed after password sign-in", profileError);
    const message = profileError instanceof Error ? profileError.message : "This account cannot access the studio site.";
    withMessage("/login", "error", message);
  }

  if (profile.status !== "active") {
    await supabase.auth.signOut();
    withMessage("/login", "error", "This account has been archived.");
  }

  const destination = profile.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
  withMessage(destination, "success", "Signed in.");
}

export async function sendPasswordResetEmail(formData: FormData) {
  const email = normalizeEmail(text(formData, "email"));

  if (!email || !isStudentEmail(email)) {
    withMessage("/forgot-password", "error", "Enter your invited IU email address.");
  }

  if (!hasRealSupabaseConfig()) {
    withMessage("/forgot-password", "error", "Supabase is not connected yet.");
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("status")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  // Do not reveal whether an address has an account. Archived accounts cannot reset access.
  if (!profile || profile.status !== "active") {
    withMessage("/login", "success", "If this account is active, a password reset email has been sent.");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getSiteUrl()
  });

  if (error) {
    console.error("Supabase password reset email failed", error);
    withMessage("/forgot-password", "error", error.message);
  }

  withMessage("/login", "success", "Check your IU email for the password reset link.");
}

export async function setPassword(formData: FormData) {
  const { profile } = await requireProfile();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");

  if (password.length < 10) {
    withMessage("/auth/set-password", "error", "Use at least 10 characters for your password.");
  }

  if (password !== confirmation) {
    withMessage("/auth/set-password", "error", "The passwords do not match.");
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Supabase password update failed", error);
    withMessage("/auth/set-password", "error", error.message);
  }

  const destination = profile.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
  withMessage(destination, "success", "Password saved.");
}

export async function signOut() {
  if (isFrontendPreviewActive()) {
    cookies().delete(FRONTEND_PREVIEW_COOKIE);
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createSemester(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name");
  const semesterDates = inferSemesterDates(name);
  const startDate = text(formData, "start_date") || semesterDates.startDate;
  const endDate = text(formData, "end_date") || semesterDates.endDate;
  const isCurrent = formData.get("is_current") === "on";
  const next = redirectPath(formData, "/admin/dashboard");

  if (!name) {
    withMessage(next, "error", "Semester name is required.");
  }

  completePreviewAction(next, "Semester created.");

  const admin = createSupabaseAdminClient();

  if (isCurrent) {
    await admin.from("semesters").update({ is_current: false }).eq("is_current", true);
  }

  const { error } = await admin.from("semesters").insert({
    name,
    start_date: startDate,
    end_date: endDate,
    is_current: isCurrent
  });

  if (error) {
    throw error;
  }

  revalidatePath("/", "layout");
  withMessage(next, "success", "Semester created.");
}

export async function setCurrentSemester(formData: FormData) {
  await requireAdmin();
  const semesterId = text(formData, "semester_id");
  const next = redirectPath(formData, "/admin/dashboard");

  completePreviewAction(next, "Current semester updated.");

  const admin = createSupabaseAdminClient();

  await admin.from("semesters").update({ is_current: false }).eq("is_current", true);
  const { error } = await admin.from("semesters").update({ is_current: true }).eq("id", semesterId);

  if (error) {
    throw error;
  }

  revalidatePath("/", "layout");
  withMessage(next, "success", "Current semester updated.");
}

function inferSemesterDates(name: string) {
  const year = Number(name.match(/\b(20\d{2})\b/)?.[1] ?? new Date().getFullYear());
  const normalized = name.toLowerCase();

  if (normalized.includes("spring")) {
    return { startDate: `${year}-01-01`, endDate: `${year}-05-31` };
  }

  if (normalized.includes("summer")) {
    return { startDate: `${year}-06-01`, endDate: `${year}-07-31` };
  }

  if (normalized.includes("fall") || normalized.includes("autumn")) {
    return { startDate: `${year}-08-01`, endDate: `${year}-12-31` };
  }

  return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

export async function inviteStudents(formData: FormData) {
  const { profile } = await requireAdmin();
  const roster = text(formData, "roster");
  const next = redirectPath(formData, "/admin/students");
  const parsed = roster
    .split(/\r?\n/)
    .map(parseRosterLine)
    .filter((entry): entry is { fullName: string; email: string } => Boolean(entry));

  if (parsed.length === 0) {
    withMessage(next, "error", "Paste at least one student name and @iu.edu email.");
  }

  completePreviewAction(next, `${parsed.length} invitation${parsed.length === 1 ? "" : "s"} saved.`);

  const admin = createSupabaseAdminClient();
  let sent = 0;
  let alreadyActive = 0;
  const failed: string[] = [];

  for (const entry of parsed) {
    if (!isStudentEmail(entry.email)) {
      withMessage(next, "error", `${entry.email} is not an @iu.edu email address.`);
    }

    const { data: existingProfile, error: existingProfileError } = await admin
      .from("profiles")
      .select("id")
      .eq("email", entry.email)
      .maybeSingle();

    if (existingProfileError) {
      throw existingProfileError;
    }

    if (existingProfile) {
      alreadyActive += 1;
      continue;
    }

    const { error: invitationError } = await admin.from("invitations").upsert(
      {
        email: entry.email,
        full_name: entry.fullName,
        role: "student",
        status: "pending",
        invited_by: profile.id,
        expires_at: null
      },
      { onConflict: "email" }
    );

    if (invitationError) {
      throw invitationError;
    }

    const { error: authInvitationError } = await admin.auth.admin.inviteUserByEmail(entry.email, {
      redirectTo: getSiteUrl(),
      data: {
        full_name: entry.fullName,
        role: "student"
      }
    });

    if (authInvitationError) {
      // A pending invitation may already have created an Auth user. Keep its database invitation
      // intact and avoid treating a repeat submission as a failed roster update.
      if (/already (?:been )?registered|already exists/i.test(authInvitationError.message)) {
        continue;
      }

      console.error("Supabase student invitation email failed", authInvitationError);
      failed.push(entry.email);
      continue;
    }

    sent += 1;
  }

  revalidatePath("/admin/students");

  if (failed.length) {
    withMessage(
      next,
      "error",
      `Invitations were saved, but email could not be sent to ${failed.join(", ")}. Check Supabase SMTP and try again.`
    );
  }

  const details = [
    sent ? `${sent} email${sent === 1 ? "" : "s"} sent` : null,
    alreadyActive ? `${alreadyActive} already active` : null
  ]
    .filter(Boolean)
    .join(" · ");
  withMessage(next, "success", details || "Invitations are already awaiting activation.");
}

function parseRosterLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const emailMatch = trimmed.match(/[A-Z0-9._%+-]+@iu\.edu/i);
  if (!emailMatch) {
    return null;
  }

  const email = normalizeEmail(emailMatch[0]);
  const fullName =
    trimmed
      .replace(emailMatch[0], "")
      .replace(/[<>,;-]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || email.split("@")[0];

  return { fullName, email };
}

export async function archiveStudent(formData: FormData) {
  await requireAdmin();
  const studentId = text(formData, "student_id");
  const next = redirectPath(formData, "/admin/students");

  completePreviewAction(next, "Student archived.");

  const admin = createSupabaseAdminClient();

  const { data: student, error: studentError } = await admin
    .from("profiles")
    .select("id,email")
    .eq("id", studentId)
    .eq("role", "student")
    .single();

  if (studentError) {
    throw studentError;
  }

  const { error } = await admin
    .from("profiles")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) {
    throw error;
  }

  await admin.from("invitations").update({ status: "accepted" }).eq("email", student.email);

  revalidatePath("/admin/students");
  withMessage(next, "success", "Student archived.");
}

export async function restoreStudent(formData: FormData) {
  await requireAdmin();
  const studentId = text(formData, "student_id");
  const next = redirectPath(formData, "/admin/students?view=archived");

  completePreviewAction(next, "Student restored.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .eq("role", "student");

  if (error) {
    throw error;
  }

  revalidatePath("/admin/students");
  withMessage(next, "success", "Student restored.");
}

export async function createLessonSlot(formData: FormData) {
  const { profile } = await requireAdmin();
  const currentSemester = await getCurrentSemester();
  const semesterId = text(formData, "semester_id") || currentSemester?.id;
  const startTime = zonedDateTimeToUtcIso(text(formData, "start_time"));
  const endTime = addMinutes(startTime, 60);
  const next = redirectPath(formData, "/admin/lessons");

  if (!semesterId) {
    withMessage(next, "error", "Create a current semester before adding lesson slots.");
  }

  completePreviewAction(next, "Lesson slot created.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("lesson_slots").insert({
    semester_id: semesterId,
    start_time: startTime,
    end_time: endTime,
    location: optionalText(formData, "location"),
    notes: optionalText(formData, "notes"),
    status: "available",
    created_by: profile.id
  });

  if (error) {
    throw error;
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/student/lessons/book");
  withMessage(next, "success", "Lesson slot created.");
}

export async function createLessonSlotsForDay(formData: FormData) {
  const { profile } = await requireAdmin();
  const semester = await getCurrentSemester();
  const next = redirectPath(formData, "/admin/lessons");

  if (!semester) {
    withMessage(next, "error", "Create a current semester before publishing lessons.");
  }

  const date = text(formData, "date");
  const startTime = text(formData, "start_time");
  const endTime = text(formData, "end_time");
  const location = optionalText(formData, "location");
  const notes = optionalText(formData, "notes");
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    withMessage(next, "error", "End time must be after start time.");
  }

  const slots = [];
  for (let minute = startMinutes; minute + 60 <= endMinutes; minute += 60) {
    const start = zonedDateAndTimeToUtcIso(date, minutesToTime(minute));
    slots.push({
      semester_id: semester.id,
      start_time: start,
      end_time: addMinutes(start, 60),
      location,
      notes,
      status: "available",
      created_by: profile.id
    });
  }

  if (slots.length === 0) {
    withMessage(next, "error", "No 60-minute lesson slots fit in that range.");
  }

  completePreviewAction(next, `${slots.length} lesson slot${slots.length === 1 ? "" : "s"} created.`);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("lesson_slots").insert(slots);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/student/lessons/book");
  withMessage(next, "success", `${slots.length} lesson slot${slots.length === 1 ? "" : "s"} created.`);
}

export async function bookLessonSlot(formData: FormData) {
  const { profile } = await requireStudent();
  const slotId = text(formData, "slot_id");
  const next = redirectPath(formData, "/student/lessons/book");

  completePreviewAction(next, "Lesson booked.");

  const supabase = createSupabaseServerClient();

  const { data: slot, error } = await supabase
    .from("lesson_slots")
    .update({
      status: "booked",
      booked_by: profile.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", slotId)
    .eq("status", "available")
    .gt("start_time", new Date().toISOString())
    .select("id,start_time")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!slot) {
    withMessage(next, "error", "That lesson slot is no longer available.");
  }

  revalidatePath("/student/lessons");
  revalidatePath("/student/lessons/book");
  revalidatePath("/admin/lessons");
  withMessage(next, "success", `Lesson booked for ${formatDateTime(slot.start_time)}.`);
}

export async function cancelLessonBooking(formData: FormData) {
  const { profile } = await requireStudent();
  const slotId = text(formData, "slot_id");
  const reason = optionalText(formData, "reason");
  const next = redirectPath(formData, "/student/lessons");

  completePreviewAction(next, "Lesson cancelled.");

  const supabase = createSupabaseServerClient();
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: slot, error } = await supabase
    .from("lesson_slots")
    .update({
      status: "cancelled_by_student",
      updated_at: new Date().toISOString()
    })
    .eq("id", slotId)
    .eq("booked_by", profile.id)
    .eq("status", "booked")
    .gt("start_time", cutoff)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!slot) {
    withMessage(next, "error", "Lessons can only be cancelled more than 24 hours before the start time.");
  }

  await supabase.from("lesson_cancellations").insert({
    lesson_slot_id: slot.id,
    student_id: profile.id,
    cancelled_by: profile.id,
    reason
  });

  revalidatePath("/student/lessons");
  revalidatePath("/student/lessons/book");
  revalidatePath("/admin/lessons");
  withMessage(next, "success", "Lesson cancelled.");
}

export async function requestLessonExchange(formData: FormData) {
  const { profile } = await requireStudent();
  const targetSlotId = text(formData, "target_slot_id");
  const offeredSlotId = text(formData, "offered_slot_id");
  const message = optionalText(formData, "message");
  const next = redirectPath(formData, "/student/lessons/book");

  if (!targetSlotId || !offeredSlotId || targetSlotId === offeredSlotId) {
    withMessage(next, "error", "Choose one of your lessons to offer for exchange.");
  }

  completePreviewAction(next, "Exchange request sent.");

  const admin = createSupabaseAdminClient();
  const cutoff = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: slots, error: slotsError } = await admin
    .from("lesson_slots")
    .select("id,booked_by,status,start_time")
    .in("id", [targetSlotId, offeredSlotId]);

  if (slotsError) {
    throw slotsError;
  }

  const targetSlot = slots?.find((slot) => slot.id === targetSlotId);
  const offeredSlot = slots?.find((slot) => slot.id === offeredSlotId);

  if (
    !targetSlot ||
    targetSlot.status !== "booked" ||
    !targetSlot.booked_by ||
    targetSlot.booked_by === profile.id ||
    targetSlot.start_time <= cutoff
  ) {
    withMessage(next, "error", "That lesson is not available for exchange.");
  }

  if (
    !offeredSlot ||
    offeredSlot.status !== "booked" ||
    offeredSlot.booked_by !== profile.id ||
    offeredSlot.start_time <= cutoff
  ) {
    withMessage(next, "error", "Choose one of your lessons more than 24 hours away.");
  }

  const { error } = await admin.from("lesson_exchange_requests").insert({
    requester_id: profile.id,
    requested_from: targetSlot.booked_by,
    requester_lesson_slot_id: offeredSlot.id,
    target_lesson_slot_id: targetSlot.id,
    message
  });

  if (error) {
    if (error.code === "23505") {
      withMessage(next, "error", "You already have a pending request for this exchange.");
    }
    throw error;
  }

  revalidatePath("/student/lessons/book");
  withMessage(next, "success", "Exchange request sent.");
}

export async function acceptLessonExchange(formData: FormData) {
  const { profile } = await requireStudent();
  const requestId = text(formData, "request_id");
  const next = redirectPath(formData, "/student/lessons/book");

  completePreviewAction(next, "Exchange accepted.");

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("accept_lesson_exchange_request", {
    p_request_id: requestId,
    p_actor_id: profile.id
  });

  if (error) {
    withMessage(next, "error", error.message || "Could not accept this exchange.");
  }

  revalidatePath("/student/lessons");
  revalidatePath("/student/lessons/book");
  revalidatePath("/admin/lessons");
  withMessage(next, "success", "Exchange accepted.");
}

export async function declineLessonExchange(formData: FormData) {
  const { profile } = await requireStudent();
  const requestId = text(formData, "request_id");
  const next = redirectPath(formData, "/student/lessons/book");

  completePreviewAction(next, "Exchange declined.");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("lesson_exchange_requests")
    .update({ status: "declined", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("requested_from", profile.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    withMessage(next, "error", "That exchange request is no longer pending.");
  }

  revalidatePath("/student/lessons/book");
  withMessage(next, "success", "Exchange declined.");
}

export async function cancelLessonExchangeRequest(formData: FormData) {
  const { profile } = await requireStudent();
  const requestId = text(formData, "request_id");
  const next = redirectPath(formData, "/student/lessons/book");

  completePreviewAction(next, "Exchange request cancelled.");

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("lesson_exchange_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("requester_id", profile.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    withMessage(next, "error", "That exchange request is no longer pending.");
  }

  revalidatePath("/student/lessons/book");
  withMessage(next, "success", "Exchange request cancelled.");
}

export async function adminAssignLesson(formData: FormData) {
  await requireAdmin();
  const slotId = text(formData, "slot_id");
  const studentId = text(formData, "student_id");
  const next = redirectPath(formData, "/admin/lessons");

  completePreviewAction(next, "Lesson assigned.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("lesson_slots")
    .update({
      status: "booked",
      booked_by: studentId,
      updated_at: new Date().toISOString()
    })
    .eq("id", slotId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/student/lessons");
  withMessage(next, "success", "Lesson assigned.");
}

export async function adminCancelLesson(formData: FormData) {
  await requireAdmin();
  const slotId = text(formData, "slot_id");
  const next = redirectPath(formData, "/admin/lessons");

  completePreviewAction(next, "Lesson cancelled.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("lesson_slots")
    .update({
      status: "cancelled_by_teacher",
      updated_at: new Date().toISOString()
    })
    .eq("id", slotId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/lessons");
  revalidatePath("/student/lessons");
  withMessage(next, "success", "Lesson cancelled.");
}

export async function adminCreateStudioClass(formData: FormData) {
  const { profile } = await requireAdmin();
  const semester = await getCurrentSemester();
  const next = redirectPath(formData, "/admin/studio-classes");

  if (!semester) {
    withMessage(next, "error", "Create a current semester before adding studio classes.");
  }

  const startTime = zonedDateTimeToUtcIso(text(formData, "start_time"));
  const endTime = zonedDateTimeToUtcIso(text(formData, "end_time"));

  completePreviewAction(next, "Studio class created.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin.from("studio_classes").insert({
    semester_id: semester.id,
    title: text(formData, "title") || "Studio Class",
    start_time: startTime,
    end_time: endTime,
    location: optionalText(formData, "location"),
    notes: optionalText(formData, "notes"),
    status: "upcoming",
    created_by: profile.id
  });

  if (error) {
    throw error;
  }

  revalidatePath("/admin/studio-classes");
  revalidatePath("/student/studio-class");
  withMessage(next, "success", "Studio class created.");
}

export async function adminUpdateStudioClass(formData: FormData) {
  await requireAdmin();
  const classId = text(formData, "class_id");
  const next = redirectPath(formData, "/admin/studio-classes");

  completePreviewAction(next, "Studio class updated.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("studio_classes")
    .update({
      title: text(formData, "title") || "Studio Class",
      start_time: zonedDateTimeToUtcIso(text(formData, "start_time")),
      end_time: zonedDateTimeToUtcIso(text(formData, "end_time")),
      location: optionalText(formData, "location"),
      notes: optionalText(formData, "notes"),
      status: text(formData, "status") || "upcoming",
      updated_at: new Date().toISOString()
    })
    .eq("id", classId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/studio-classes");
  revalidatePath(`/admin/studio-classes/${classId}`);
  revalidatePath("/student/studio-class");
  withMessage(next, "success", "Studio class updated.");
}

export async function adminCancelStudioClass(formData: FormData) {
  await requireAdmin();
  const classId = text(formData, "class_id");
  const next = redirectPath(formData, "/admin/studio-classes");

  completePreviewAction(next, "Studio class cancelled.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("studio_classes")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", classId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/studio-classes");
  revalidatePath("/student/studio-class");
  withMessage(next, "success", "Studio class cancelled.");
}

export async function signUpForStudioClass(formData: FormData) {
  const { profile } = await requireStudent();
  const next = redirectPath(formData, "/student/studio-class");
  const classId = text(formData, "studio_class_id");
  const pieceTitle = text(formData, "piece_title");
  const composer = text(formData, "composer");

  if (!pieceTitle || !composer) {
    withMessage(next, "error", "Piece title and composer are required.");
  }

  completePreviewAction(next, "Studio class signup saved.");

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("studio_class_signups").upsert(
    {
      studio_class_id: classId,
      student_id: profile.id,
      piece_title: pieceTitle,
      composer,
      movement_or_section: optionalText(formData, "movement_or_section"),
      estimated_duration_minutes: optionalInt(formData, "estimated_duration_minutes"),
      notes: optionalText(formData, "notes"),
      status: "signed_up",
      updated_at: new Date().toISOString()
    },
    { onConflict: "studio_class_id,student_id" }
  );

  if (error) {
    throw error;
  }

  revalidatePath("/student/studio-class");
  revalidatePath("/admin/studio-classes");
  withMessage(next, "success", "Studio class signup saved.");
}

export async function withdrawStudioClassSignup(formData: FormData) {
  const { profile } = await requireStudent();
  const signupId = text(formData, "signup_id");
  const next = redirectPath(formData, "/student/studio-class");

  completePreviewAction(next, "Studio class signup withdrawn.");

  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("studio_class_signups")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", signupId)
    .eq("student_id", profile.id);

  if (error) {
    throw error;
  }

  revalidatePath("/student/studio-class");
  revalidatePath("/admin/studio-classes");
  withMessage(next, "success", "Studio class signup withdrawn.");
}

export async function adminMarkPerformed(formData: FormData) {
  await requireAdmin();
  const signupId = text(formData, "signup_id");
  const next = redirectPath(formData, "/admin/studio-classes");

  completePreviewAction(next, "Signup marked performed.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("studio_class_signups")
    .update({ status: "performed", updated_at: new Date().toISOString() })
    .eq("id", signupId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/studio-classes");
  revalidatePath("/admin/analytics");
  revalidatePath("/student/history");
  withMessage(next, "success", "Signup marked performed.");
}

export async function adminMarkNotPerformed(formData: FormData) {
  await requireAdmin();
  const signupId = text(formData, "signup_id");
  const next = redirectPath(formData, "/admin/studio-classes");

  completePreviewAction(next, "Signup marked not performed.");

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("studio_class_signups")
    .update({ status: "not_performed", updated_at: new Date().toISOString() })
    .eq("id", signupId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin/studio-classes");
  revalidatePath("/admin/analytics");
  revalidatePath("/student/history");
  withMessage(next, "success", "Signup marked not performed.");
}

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60 * 1000).toISOString();
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error("Invalid time.");
  }
  return hour * 60 + minute;
}

function minutesToTime(value: number) {
  const hour = Math.floor(value / 60);
  const minute = value % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
