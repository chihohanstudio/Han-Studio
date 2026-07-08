import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isFrontendPreviewActive } from "@/lib/preview";
import {
  previewAdminDashboardStats,
  previewAllStudentStats,
  previewInvitations,
  previewLessonSlots,
  previewSemester,
  previewStatsForStudent,
  previewStudioClasses,
  previewStudioSignups,
  previewStudents
} from "@/lib/preview-data";
import type {
  Invitation,
  LessonDisplayStatus,
  LessonExchangeRequest,
  LessonSlot,
  Profile,
  ProfileStatus,
  Semester,
  StudentSemesterStats,
  StudioClass,
  StudioClassSignup
} from "@/lib/types";

const lessonSlotSelect =
  "id,semester_id,start_time,end_time,status,booked_by,created_by,location,notes,created_at,updated_at,student:profiles!lesson_slots_booked_by_fkey(id,full_name,email,status)";

const studioSignupSelect =
  "id,studio_class_id,student_id,piece_title,composer,movement_or_section,estimated_duration_minutes,notes,status,created_at,updated_at,student:profiles!studio_class_signups_student_id_fkey(id,full_name,email,status),studio_class:studio_classes(id,title,start_time,end_time,status)";

const lessonExchangeSelect =
  "id,requester_id,requested_from,requester_lesson_slot_id,target_lesson_slot_id,status,message,created_at,updated_at,requester:profiles!lesson_exchange_requests_requester_id_fkey(id,full_name,email,status),requested_student:profiles!lesson_exchange_requests_requested_from_fkey(id,full_name,email,status),requester_slot:lesson_slots!lesson_exchange_requests_requester_lesson_slot_id_fkey(id,semester_id,start_time,end_time,status,booked_by,created_by,location,notes,created_at,updated_at,student:profiles!lesson_slots_booked_by_fkey(id,full_name,email,status)),target_slot:lesson_slots!lesson_exchange_requests_target_lesson_slot_id_fkey(id,semester_id,start_time,end_time,status,booked_by,created_by,location,notes,created_at,updated_at,student:profiles!lesson_slots_booked_by_fkey(id,full_name,email,status))";

export async function getCurrentSemester() {
  if (isFrontendPreviewActive()) {
    return previewSemester;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Semester | null;
}

export async function getSemesters() {
  if (isFrontendPreviewActive()) {
    return [previewSemester];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("semesters")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Semester[];
}

export async function getLessonSlots(semesterId: string) {
  if (isFrontendPreviewActive()) {
    return previewLessonSlots().filter((slot) => slot.semester_id === semesterId);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_slots")
    .select(lessonSlotSelect)
    .eq("semester_id", semesterId)
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return normalizeLessonSlots(data ?? []);
}

export async function getAvailableLessonSlots(semesterId: string) {
  if (isFrontendPreviewActive()) {
    return previewLessonSlots().filter(
      (slot) =>
        slot.semester_id === semesterId &&
        slot.status === "available" &&
        new Date(slot.start_time) > new Date()
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_slots")
    .select(lessonSlotSelect)
    .eq("semester_id", semesterId)
    .eq("status", "available")
    .gt("start_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return normalizeLessonSlots(data ?? []);
}

export async function getMyLessonSlots(semesterId: string, studentId: string) {
  if (isFrontendPreviewActive()) {
    return previewLessonSlots().filter(
      (slot) => slot.semester_id === semesterId && slot.booked_by === studentId
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_slots")
    .select(lessonSlotSelect)
    .eq("semester_id", semesterId)
    .eq("booked_by", studentId)
    .order("start_time", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeLessonSlots(data ?? []);
}

export async function getLessonExchangeRequestsForStudent(studentId: string) {
  if (isFrontendPreviewActive()) {
    return [] as LessonExchangeRequest[];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_exchange_requests")
    .select(lessonExchangeSelect)
    .or(`requester_id.eq.${studentId},requested_from.eq.${studentId}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeLessonExchangeRequests(data ?? []);
}

export async function getUpcomingLessonSlots(semesterId: string, limit = 8) {
  if (isFrontendPreviewActive()) {
    return previewLessonSlots()
      .filter((slot) => slot.semester_id === semesterId && new Date(slot.start_time) >= new Date())
      .slice(0, limit);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_slots")
    .select(lessonSlotSelect)
    .eq("semester_id", semesterId)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return normalizeLessonSlots(data ?? []);
}

export async function getInvitations() {
  if (isFrontendPreviewActive()) {
    return previewInvitations;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Invitation[];
}

export async function getStudentRoster(status: ProfileStatus = "active") {
  if (isFrontendPreviewActive()) {
    return previewStudents.filter((student) => student.status === status);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,status,created_at,updated_at")
    .eq("role", "student")
    .eq("status", status)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Profile[];
}

export async function getActiveStudents() {
  if (isFrontendPreviewActive()) {
    return previewStudents.filter((student) => student.status === "active");
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,status")
    .eq("role", "student")
    .eq("status", "active")
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Profile[];
}

export async function getProfileById(id: string) {
  if (isFrontendPreviewActive()) {
    return previewStudents.find((student) => student.id === id) ?? null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,email,role,status,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function getStudioClasses(semesterId: string) {
  if (isFrontendPreviewActive()) {
    return previewStudioClasses().filter((classItem) => classItem.semester_id === semesterId);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studio_classes")
    .select("*")
    .eq("semester_id", semesterId)
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as StudioClass[];
}

export async function getUpcomingStudioClasses(semesterId: string, limit?: number) {
  if (isFrontendPreviewActive()) {
    const rows = previewStudioClasses().filter(
      (classItem) =>
        classItem.semester_id === semesterId &&
        classItem.status === "upcoming" &&
        new Date(classItem.end_time) >= new Date()
    );
    return limit ? rows.slice(0, limit) : rows;
  }

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("studio_classes")
    .select("*")
    .eq("semester_id", semesterId)
    .eq("status", "upcoming")
    .gte("end_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as StudioClass[];
}

export async function getStudioClassById(classId: string) {
  if (isFrontendPreviewActive()) {
    return previewStudioClasses().find((classItem) => classItem.id === classId) ?? null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studio_classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as StudioClass | null;
}

export async function getStudioSignupsForSemester(semesterId: string) {
  if (isFrontendPreviewActive()) {
    const classIds = new Set(
      previewStudioClasses()
        .filter((classItem) => classItem.semester_id === semesterId)
        .map((classItem) => classItem.id)
    );
    return previewStudioSignups().filter((signup) => classIds.has(signup.studio_class_id));
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studio_class_signups")
    .select(`${studioSignupSelect},studio_classes!inner(semester_id)`)
    .eq("studio_classes.semester_id", semesterId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeStudioSignups(data ?? []);
}

export async function getStudioSignupsForClass(classId: string) {
  if (isFrontendPreviewActive()) {
    return previewStudioSignups().filter((signup) => signup.studio_class_id === classId);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studio_class_signups")
    .select(studioSignupSelect)
    .eq("studio_class_id", classId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return normalizeStudioSignups(data ?? []);
}

export async function getStudentStats(semesterId: string, studentId: string) {
  if (isFrontendPreviewActive()) {
    return previewStatsForStudent(semesterId, studentId);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_semester_stats")
    .select("*")
    .eq("semester_id", semesterId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as StudentSemesterStats | null;
}

export async function getAllStudentStats(semesterId: string) {
  if (isFrontendPreviewActive()) {
    return previewAllStudentStats(semesterId);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("student_semester_stats")
    .select("*")
    .eq("semester_id", semesterId)
    .order("full_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as StudentSemesterStats[];
}

export async function getAdminDashboardStats(semesterId: string) {
  if (isFrontendPreviewActive()) {
    return previewAdminDashboardStats(semesterId);
  }

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();

  const [
    activeStudents,
    upcomingLessons,
    completedLessons,
    upcomingStudioClasses,
    performances,
    recentBookings
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .eq("status", "active"),
    supabase
      .from("lesson_slots")
      .select("id", { count: "exact", head: true })
      .eq("semester_id", semesterId)
      .eq("status", "booked")
      .gte("start_time", now),
    supabase
      .from("lesson_slots")
      .select("id", { count: "exact", head: true })
      .eq("semester_id", semesterId)
      .eq("status", "booked")
      .lt("end_time", now),
    supabase
      .from("studio_classes")
      .select("id", { count: "exact", head: true })
      .eq("semester_id", semesterId)
      .eq("status", "upcoming")
      .gte("end_time", now),
    supabase
      .from("studio_class_signups")
      .select("id,studio_classes!inner(semester_id)", { count: "exact", head: true })
      .eq("studio_classes.semester_id", semesterId)
      .eq("status", "performed"),
    supabase
      .from("lesson_slots")
      .select(lessonSlotSelect)
      .eq("semester_id", semesterId)
      .eq("status", "booked")
      .order("updated_at", { ascending: false })
      .limit(5)
  ]);

  for (const result of [
    activeStudents,
    upcomingLessons,
    completedLessons,
    upcomingStudioClasses,
    performances,
    recentBookings
  ]) {
    if (result.error) {
      throw result.error;
    }
  }

  return {
    activeStudents: activeStudents.count ?? 0,
    upcomingLessons: upcomingLessons.count ?? 0,
    completedLessons: completedLessons.count ?? 0,
    upcomingStudioClasses: upcomingStudioClasses.count ?? 0,
    performances: performances.count ?? 0,
    recentBookings: normalizeLessonSlots(recentBookings.data ?? [])
  };
}

export function getLessonDisplayStatus(slot: Pick<LessonSlot, "status" | "end_time">): LessonDisplayStatus {
  if (slot.status === "booked" && new Date(slot.end_time) < new Date()) {
    return "completed";
  }

  return slot.status;
}

function normalizeLessonSlots(rows: unknown[]) {
  return rows.map((row) => {
    const slot = row as LessonSlot & { student?: Profile[] | Profile | null };
    const student = Array.isArray(slot.student) ? slot.student[0] : slot.student;
    return {
      ...slot,
      display_status: getLessonDisplayStatus(slot),
      student: student ?? null
    };
  });
}

function normalizeStudioSignups(rows: unknown[]) {
  return rows.map((row) => {
    const signup = row as StudioClassSignup & {
      student?: Profile[] | Profile | null;
      studio_class?: StudioClass[] | StudioClass | null;
    };
    const student = Array.isArray(signup.student) ? signup.student[0] : signup.student;
    const studioClass = Array.isArray(signup.studio_class) ? signup.studio_class[0] : signup.studio_class;
    return {
      ...signup,
      student: student ?? null,
      studio_class: studioClass ?? null
    };
  }) as StudioClassSignup[];
}

function normalizeLessonExchangeRequests(rows: unknown[]) {
  return rows.map((row) => {
    const request = row as LessonExchangeRequest & {
      requester?: Profile[] | Profile | null;
      requested_student?: Profile[] | Profile | null;
      requester_slot?: (LessonSlot & { student?: Profile[] | Profile | null })[] | (LessonSlot & { student?: Profile[] | Profile | null }) | null;
      target_slot?: (LessonSlot & { student?: Profile[] | Profile | null })[] | (LessonSlot & { student?: Profile[] | Profile | null }) | null;
    };
    const requester = Array.isArray(request.requester) ? request.requester[0] : request.requester;
    const requestedStudent = Array.isArray(request.requested_student)
      ? request.requested_student[0]
      : request.requested_student;
    const requesterSlot = Array.isArray(request.requester_slot)
      ? request.requester_slot[0]
      : request.requester_slot;
    const targetSlot = Array.isArray(request.target_slot)
      ? request.target_slot[0]
      : request.target_slot;

    return {
      ...request,
      requester: requester ?? null,
      requested_student: requestedStudent ?? null,
      requester_slot: requesterSlot ? normalizeLessonSlots([requesterSlot])[0] : null,
      target_slot: targetSlot ? normalizeLessonSlots([targetSlot])[0] : null
    };
  }) as LessonExchangeRequest[];
}
