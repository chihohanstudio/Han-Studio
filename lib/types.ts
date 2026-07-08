export type Role = "admin" | "student";
export type ProfileStatus = "active" | "archived";
export type InvitationStatus = "pending" | "accepted" | "expired";

export type LessonStatus =
  | "available"
  | "booked"
  | "cancelled_by_student"
  | "cancelled_by_teacher";

export type LessonDisplayStatus = LessonStatus | "completed";
export type LessonExchangeStatus = "pending" | "accepted" | "declined" | "cancelled";

export type StudioClassStatus = "upcoming" | "completed" | "cancelled";

export type StudioSignupStatus =
  | "signed_up"
  | "withdrawn"
  | "performed"
  | "not_performed";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  status: ProfileStatus;
  created_at?: string;
  updated_at?: string;
};

export type Invitation = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  status: InvitationStatus;
  invited_by: string | null;
  accepted_by: string | null;
  expires_at: string | null;
  created_at: string;
  accepted_at: string | null;
};

export type Semester = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: string;
};

export type LessonSlot = {
  id: string;
  semester_id: string;
  start_time: string;
  end_time: string;
  status: LessonStatus;
  display_status?: LessonDisplayStatus;
  booked_by: string | null;
  created_by: string | null;
  location: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  student?: Pick<Profile, "id" | "full_name" | "email" | "status"> | null;
};

export type LessonCancellation = {
  id: string;
  lesson_slot_id: string;
  student_id: string;
  cancelled_by: string;
  reason: string | null;
  created_at: string;
};

export type LessonExchangeRequest = {
  id: string;
  requester_id: string;
  requested_from: string;
  requester_lesson_slot_id: string;
  target_lesson_slot_id: string;
  status: LessonExchangeStatus;
  message: string | null;
  created_at: string;
  updated_at?: string;
  requester?: Pick<Profile, "id" | "full_name" | "email" | "status"> | null;
  requested_student?: Pick<Profile, "id" | "full_name" | "email" | "status"> | null;
  requester_slot?: LessonSlot | null;
  target_slot?: LessonSlot | null;
};

export type StudioClass = {
  id: string;
  semester_id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  status: StudioClassStatus;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
};

export type StudioClassSignup = {
  id: string;
  studio_class_id: string;
  student_id: string;
  piece_title: string;
  composer: string;
  movement_or_section: string | null;
  estimated_duration_minutes: number | null;
  notes: string | null;
  status: StudioSignupStatus;
  created_at?: string;
  updated_at?: string;
  student?: Pick<Profile, "id" | "full_name" | "email" | "status"> | null;
  studio_class?: Pick<StudioClass, "id" | "title" | "start_time" | "end_time" | "status"> | null;
};

export type StudentSemesterStats = {
  student_id: string;
  full_name: string;
  email: string;
  status: ProfileStatus;
  semester_id: string;
  semester_name: string;
  completed_lessons: number;
  performances: number;
};
