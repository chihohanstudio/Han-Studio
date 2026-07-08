import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import {
  LessonStatusBadge,
  ProfileStatusBadge,
  SignupStatusBadge
} from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SetupNotice } from "@/components/setup-notice";
import {
  getCurrentSemester,
  getMyLessonSlots,
  getProfileById,
  getStudentStats,
  getStudioSignupsForSemester
} from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminStudentDetailPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile: adminProfile } = await requireAdmin();
  const [student, semester] = await Promise.all([getProfileById(params.id), getCurrentSemester()]);

  if (!student || student.role !== "student") {
    notFound();
  }

  const [stats, lessons, signups] = semester
    ? await Promise.all([
        getStudentStats(semester.id, student.id),
        getMyLessonSlots(semester.id, student.id),
        getStudioSignupsForSemester(semester.id)
      ])
    : [null, [], []];
  const studentSignups = signups.filter((signup) => signup.student_id === student.id);
  const sortedLessons = [...lessons].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  return (
    <AppShell profile={adminProfile}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={student.full_name} />
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight text-neutral-900">
                {student.full_name}
              </h1>
              <ProfileStatusBadge status={student.status} />
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">{student.email}</p>
          </div>
        </div>
        <ButtonLink href="/admin/students" variant="secondary" size="sm">
          <ArrowLeft size={14} aria-hidden="true" />
          All students
        </ButtonLink>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Completed lessons"
            value={stats?.completed_lessons ?? 0}
            hint={semester ? semester.name : undefined}
            icon={<CalendarClock size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Performances"
            value={stats?.performances ?? 0}
            hint={semester ? semester.name : undefined}
            icon={<GraduationCap size={18} aria-hidden="true" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="self-start">
            <CardHeader title="Lesson history" />
            {sortedLessons.length ? (
              <ul className="divide-y divide-line">
                {sortedLessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">
                        {formatDateTime(lesson.start_time)}
                      </p>
                      <p className="mt-0.5 text-13 text-neutral-500">
                        {lesson.location || "Location TBA"}
                      </p>
                    </div>
                    <LessonStatusBadge status={lesson.display_status ?? lesson.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <CardBody>
                <p className="text-13 text-neutral-500">
                  No lesson records for the current semester.
                </p>
              </CardBody>
            )}
          </Card>

          <Card className="self-start">
            <CardHeader title="Performance history" />
            {studentSignups.length ? (
              <ul className="divide-y divide-line">
                {studentSignups.map((signup) => (
                  <li key={signup.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">
                        {signup.composer}: {signup.piece_title}
                        {signup.movement_or_section ? `, ${signup.movement_or_section}` : ""}
                      </p>
                      <p className="mt-0.5 text-13 text-neutral-500">
                        {signup.studio_class
                          ? formatDateTime(signup.studio_class.start_time)
                          : "Studio class"}
                      </p>
                    </div>
                    <SignupStatusBadge status={signup.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <CardBody>
                <p className="text-13 text-neutral-500">No studio class signups yet.</p>
              </CardBody>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
