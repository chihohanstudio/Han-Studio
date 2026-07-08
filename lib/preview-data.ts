import {
  PREVIEW_ADMIN_PROFILE,
  PREVIEW_STUDENT_PROFILE
} from "@/lib/preview";
import type {
  Invitation,
  LessonDisplayStatus,
  LessonSlot,
  Profile,
  Semester,
  StudentSemesterStats,
  StudioClass,
  StudioClassSignup
} from "@/lib/types";

const createdAt = "2026-07-01T12:00:00.000Z";

export const previewSemester: Semester = {
  id: "30000000-0000-0000-0000-000000000001",
  name: "Fall 2027",
  start_date: "2027-08-23",
  end_date: "2027-12-17",
  is_current: true,
  created_at: createdAt
};

export const previewStudents: Profile[] = [
  PREVIEW_STUDENT_PROFILE,
  {
    id: "20000000-0000-0000-0000-000000000002",
    full_name: "Maya Chen",
    email: "mayachen@iu.edu",
    role: "student",
    status: "active",
    created_at: createdAt,
    updated_at: createdAt
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    full_name: "Ethan Park",
    email: "epark@iu.edu",
    role: "student",
    status: "active",
    created_at: createdAt,
    updated_at: createdAt
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    full_name: "Lina Morales",
    email: "lmorales@iu.edu",
    role: "student",
    status: "archived",
    created_at: createdAt,
    updated_at: createdAt
  }
];

export const previewInvitations: Invitation[] = [
  {
    id: "40000000-0000-0000-0000-000000000001",
    email: "noahliu@iu.edu",
    full_name: "Noah Liu",
    role: "student",
    status: "pending",
    invited_by: PREVIEW_ADMIN_PROFILE.id,
    accepted_by: null,
    expires_at: null,
    created_at: createdAt,
    accepted_at: null
  },
  {
    id: "40000000-0000-0000-0000-000000000002",
    email: "mayachen@iu.edu",
    full_name: "Maya Chen",
    role: "student",
    status: "accepted",
    invited_by: PREVIEW_ADMIN_PROFILE.id,
    accepted_by: previewStudents[1].id,
    expires_at: null,
    created_at: createdAt,
    accepted_at: "2026-07-02T14:00:00.000Z"
  }
];

export function previewLessonSlots() {
  const rows: LessonSlot[] = [
    lesson("50000000-0000-0000-0000-000000000001", -16, "booked", PREVIEW_STUDENT_PROFILE.id, "Merrill Hall 214", "Bach prelude review"),
    lesson("50000000-0000-0000-0000-000000000002", -9, "booked", previewStudents[1].id, "Merrill Hall 214", "Chopin etude"),
    lesson("50000000-0000-0000-0000-000000000003", 2, "booked", PREVIEW_STUDENT_PROFILE.id, "Merrill Hall 214", null),
    lesson("50000000-0000-0000-0000-000000000004", 3, "available", null, "Merrill Hall 214", "Open lesson slot"),
    lesson("50000000-0000-0000-0000-000000000005", 4, "booked", previewStudents[2].id, "Merrill Hall 214", null),
    lesson("50000000-0000-0000-0000-000000000006", 5, "available", null, "Merrill Hall 214", null),
    lesson("50000000-0000-0000-0000-000000000007", 8, "available", null, "Auer Hall", "Makeup slot")
  ];

  return rows
    .map((slot) => ({
      ...slot,
      display_status: previewLessonDisplayStatus(slot),
      student: previewStudents.find((student) => student.id === slot.booked_by) ?? null
    }))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

function previewLessonDisplayStatus(slot: Pick<LessonSlot, "status" | "end_time">): LessonDisplayStatus {
  if (slot.status === "booked" && new Date(slot.end_time) < new Date()) {
    return "completed";
  }

  return slot.status;
}

export function previewStudioClasses() {
  const rows: StudioClass[] = [
    studioClass("60000000-0000-0000-0000-000000000001", -20, "Studio Class 01", "completed"),
    studioClass("60000000-0000-0000-0000-000000000002", 4, "Studio Class 02", "upcoming"),
    studioClass("60000000-0000-0000-0000-000000000003", 11, "Studio Class 03", "upcoming")
  ];

  return rows.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

export function previewStudioSignups() {
  const classes = previewStudioClasses();
  const rows: StudioClassSignup[] = [
    signup(
      "70000000-0000-0000-0000-000000000001",
      classes[0],
      PREVIEW_STUDENT_PROFILE,
      "Partita No. 1",
      "J.S. Bach",
      "Allemande",
      "performed"
    ),
    signup(
      "70000000-0000-0000-0000-000000000002",
      classes[0],
      previewStudents[1],
      "Etude Op. 10 No. 4",
      "Chopin",
      null,
      "performed"
    ),
    signup(
      "70000000-0000-0000-0000-000000000003",
      classes[1],
      PREVIEW_STUDENT_PROFILE,
      "Sonata No. 2",
      "Prokofiev",
      "I. Allegro",
      "signed_up"
    ),
    signup(
      "70000000-0000-0000-0000-000000000004",
      classes[1],
      previewStudents[2],
      "Jeux d'eau",
      "Ravel",
      null,
      "signed_up"
    )
  ];

  return rows;
}

export function previewStatsForStudent(semesterId: string, studentId: string) {
  const student = previewStudents.find((row) => row.id === studentId);

  if (!student) {
    return null;
  }

  const completedLessons = previewLessonSlots().filter(
    (slot) => slot.booked_by === studentId && slot.display_status === "completed"
  ).length;
  const performances = previewStudioSignups().filter(
    (signup) => signup.student_id === studentId && signup.status === "performed"
  ).length;

  return {
    student_id: student.id,
    full_name: student.full_name,
    email: student.email,
    status: student.status,
    semester_id: semesterId,
    semester_name: previewSemester.name,
    completed_lessons: completedLessons,
    performances
  } satisfies StudentSemesterStats;
}

export function previewAllStudentStats(semesterId: string) {
  return previewStudents
    .map((student) => previewStatsForStudent(semesterId, student.id))
    .filter((stats): stats is StudentSemesterStats => Boolean(stats));
}

export function previewAdminDashboardStats(semesterId: string) {
  const lessons = previewLessonSlots().filter((slot) => slot.semester_id === semesterId);
  const signups = previewStudioSignups();

  return {
    activeStudents: previewStudents.filter((student) => student.status === "active").length,
    upcomingLessons: lessons.filter((slot) => slot.status === "booked" && new Date(slot.start_time) >= new Date()).length,
    completedLessons: lessons.filter((slot) => slot.display_status === "completed").length,
    upcomingStudioClasses: previewStudioClasses().filter((classItem) => classItem.status === "upcoming").length,
    performances: signups.filter((signup) => signup.status === "performed").length,
    recentBookings: lessons.filter((slot) => slot.status === "booked").slice(-5).reverse()
  };
}

function lesson(
  id: string,
  dayOffset: number,
  status: LessonSlot["status"],
  bookedBy: string | null,
  location: string,
  notes: string | null
) {
  const start = previewDate(dayOffset, 14, 30);
  return {
    id,
    semester_id: previewSemester.id,
    start_time: start.toISOString(),
    end_time: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
    status,
    booked_by: bookedBy,
    created_by: PREVIEW_ADMIN_PROFILE.id,
    location,
    notes,
    created_at: createdAt,
    updated_at: createdAt
  } satisfies LessonSlot;
}

function studioClass(
  id: string,
  dayOffset: number,
  title: string,
  status: StudioClass["status"]
) {
  const start = previewDate(dayOffset, 17, 0);
  return {
    id,
    semester_id: previewSemester.id,
    title,
    start_time: start.toISOString(),
    end_time: new Date(start.getTime() + 90 * 60 * 1000).toISOString(),
    location: "Merrill Hall 409",
    notes: "Weekly studio class and performance discussion.",
    status,
    created_by: PREVIEW_ADMIN_PROFILE.id,
    created_at: createdAt,
    updated_at: createdAt
  } satisfies StudioClass;
}

function signup(
  id: string,
  classItem: StudioClass,
  student: Profile,
  pieceTitle: string,
  composer: string,
  movement: string | null,
  status: StudioClassSignup["status"]
) {
  return {
    id,
    studio_class_id: classItem.id,
    student_id: student.id,
    piece_title: pieceTitle,
    composer,
    movement_or_section: movement,
    estimated_duration_minutes: 8,
    notes: "Preview repertoire note.",
    status,
    created_at: createdAt,
    updated_at: createdAt,
    student,
    studio_class: classItem
  } satisfies StudioClassSignup;
}

function previewDate(dayOffset: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setUTCHours(hour + 4, minute, 0, 0);
  return date;
}
