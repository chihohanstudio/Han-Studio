import { CalendarClock, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LessonStatusBadge, SignupStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SetupNotice } from "@/components/setup-notice";
import {
  getCurrentSemester,
  getMyLessonSlots,
  getStudentStats,
  getStudioSignupsForSemester
} from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireStudent } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function StudentHistoryPage() {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireStudent();
  const semester = await getCurrentSemester();
  const [stats, lessons, signups] = semester
    ? await Promise.all([
        getStudentStats(semester.id, profile.id),
        getMyLessonSlots(semester.id, profile.id),
        getStudioSignupsForSemester(semester.id)
      ])
    : [null, [], []];

  const pastLessons = lessons
    .filter((lesson) => new Date(lesson.start_time) < new Date())
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  const myPerformances = signups
    .filter((signup) => signup.student_id === profile.id && signup.status !== "signed_up")
    .sort((a, b) => {
      const aTime = a.studio_class ? new Date(a.studio_class.start_time).getTime() : 0;
      const bTime = b.studio_class ? new Date(b.studio_class.start_time).getTime() : 0;
      return bTime - aTime;
    });

  return (
    <AppShell profile={profile}>
      <PageHeader
        title="History"
        description={
          semester
            ? `Your ${semester.name} record. Only completed lessons and performed signups count.`
            : "No current semester yet."
        }
      />

      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Completed lessons"
            value={stats?.completed_lessons ?? 0}
            hint="This semester"
            icon={<CalendarClock size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Performances"
            value={stats?.performances ?? 0}
            hint="Studio class this semester"
            icon={<GraduationCap size={18} aria-hidden="true" />}
          />
        </div>

        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Lesson history
          </h2>
          {pastLessons.length ? (
            <Card>
              <ul className="divide-y divide-line">
                {pastLessons.map((lesson) => (
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
            </Card>
          ) : (
            <EmptyState
              title="No past lessons"
              body="Completed lessons appear after their end time passes."
            />
          )}
        </section>

        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Performance history
          </h2>
          {myPerformances.length ? (
            <Card>
              <ul className="divide-y divide-line">
                {myPerformances.map((signup) => (
                  <li key={signup.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">
                        {signup.composer}: {signup.piece_title}
                        {signup.movement_or_section ? `, ${signup.movement_or_section}` : ""}
                      </p>
                      <p className="mt-0.5 text-13 text-neutral-500">
                        {signup.studio_class
                          ? `${signup.studio_class.title} · ${formatDateTime(signup.studio_class.start_time)}`
                          : "Studio class"}
                      </p>
                    </div>
                    <SignupStatusBadge status={signup.status} />
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <EmptyState title="No performances" body="Performed studio class signups appear here." />
          )}
        </section>
      </div>
    </AppShell>
  );
}
