import { CalendarClock, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, SignupStatusBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageMessage } from "@/components/ui/message";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SetupNotice } from "@/components/setup-notice";
import {
  getCurrentSemester,
  getMyLessonSlots,
  getStudentStats,
  getStudioSignupsForSemester,
  getUpcomingStudioClasses
} from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireStudent } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function StudentDashboardPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireStudent();
  const semester = await getCurrentSemester();
  const [lessons, studioClasses, signups, stats] = semester
    ? await Promise.all([
        getMyLessonSlots(semester.id, profile.id),
        getUpcomingStudioClasses(semester.id, 2),
        getStudioSignupsForSemester(semester.id),
        getStudentStats(semester.id, profile.id)
      ])
    : [[], [], [], null];

  const nextLesson = lessons
    .filter((slot) => slot.status === "booked" && new Date(slot.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
  const nextClass = studioClasses[0];
  const nextClassSignup = nextClass
    ? signups.find(
        (signup) => signup.studio_class_id === nextClass.id && signup.student_id === profile.id
      )
    : null;

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title={`Welcome, ${profile.full_name.split(" ")[0]}`}
        description={
          semester
            ? `Your ${semester.name} lessons and studio class activity.`
            : "No current semester yet."
        }
      />

      {!semester ? (
        <EmptyState
          title="No current semester"
          body="Lesson and studio class tools appear once an admin creates a semester."
        />
      ) : (
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

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Next lesson"
                action={
                  <ButtonLink href="/student/lessons" variant="secondary" size="sm">
                    My lessons
                  </ButtonLink>
                }
              />
              <CardBody>
                {nextLesson ? (
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">
                      {formatDateTime(nextLesson.start_time)}
                    </p>
                    <p className="mt-1 text-13 text-neutral-500">
                      {nextLesson.location || "Location TBA"}
                    </p>
                    {nextLesson.notes ? (
                      <p className="mt-2 text-13 text-neutral-700">{nextLesson.notes}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-sm font-medium text-neutral-900">No upcoming lesson</p>
                    <p className="mt-1 text-13 text-neutral-500">
                      Choose an available one-hour slot to book your next lesson.
                    </p>
                    <ButtonLink href="/student/lessons/book" size="sm" className="mt-3">
                      Book lesson
                    </ButtonLink>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Next studio class"
                action={
                  <ButtonLink href="/student/studio-class" variant="secondary" size="sm">
                    View
                  </ButtonLink>
                }
              />
              <CardBody>
                {nextClass ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-neutral-900">{nextClass.title}</p>
                      <p className="mt-1 text-13 text-neutral-500">
                        {formatDateTime(nextClass.start_time)}
                        {nextClass.location ? ` · ${nextClass.location}` : ""}
                      </p>
                    </div>
                    {nextClassSignup ? (
                      <SignupStatusBadge status={nextClassSignup.status} />
                    ) : (
                      <Badge tone="neutral">Not signed up</Badge>
                    )}
                  </div>
                ) : (
                  <div className="py-2">
                    <p className="text-sm font-medium text-neutral-900">No upcoming studio class</p>
                    <p className="mt-1 text-13 text-neutral-500">
                      Weekly studio classes will appear here.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
