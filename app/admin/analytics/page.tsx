import Link from "next/link";
import { BarChart3, CalendarClock, Music, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProfileStatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { SetupNotice } from "@/components/setup-notice";
import {
  getAllStudentStats,
  getCurrentSemester,
  getLessonSlots,
  getStudioSignupsForSemester
} from "@/lib/data";
import { formatDate } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminAnalyticsPage() {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireAdmin();
  const semester = await getCurrentSemester();
  const [stats, lessons, signups] = semester
    ? await Promise.all([
        getAllStudentStats(semester.id),
        getLessonSlots(semester.id),
        getStudioSignupsForSemester(semester.id)
      ])
    : [[], [], []];

  const activeStudents = stats.filter((row) => row.status === "active").length;
  const completedLessons = stats.reduce((sum, row) => sum + row.completed_lessons, 0);
  const performances = stats.reduce((sum, row) => sum + row.performances, 0);
  const averageLessons = activeStudents ? completedLessons / activeStudents : 0;
  const averagePerformances = activeStudents ? performances / activeStudents : 0;

  return (
    <AppShell profile={profile}>
      <PageHeader
        title="Analytics"
        description={
          semester
            ? `${semester.name} semester statistics.`
            : "Create a current semester to view analytics."
        }
      />

      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Active students"
            value={activeStudents}
            icon={<Users size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Completed lessons"
            value={completedLessons}
            icon={<CalendarClock size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Performances"
            value={performances}
            icon={<Music size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Avg lessons"
            value={averageLessons.toFixed(1)}
            hint="Per active student"
            icon={<TrendingUp size={18} aria-hidden="true" />}
          />
          <StatCard
            label="Avg performances"
            value={averagePerformances.toFixed(1)}
            hint="Per active student"
            icon={<BarChart3 size={18} aria-hidden="true" />}
          />
        </div>

        <Card>
          <CardHeader
            title="Student statistics"
            description="Completed lessons and performed signups only"
          />
          {stats.length ? (
            <Table>
              <THead>
                <TR>
                  <TH>Student</TH>
                  <TH>Email</TH>
                  <TH className="text-right">Lessons</TH>
                  <TH className="text-right">Performances</TH>
                  <TH>Latest lesson</TH>
                  <TH>Latest performance</TH>
                  <TH className="text-right">Status</TH>
                </TR>
              </THead>
              <TBody>
                {stats.map((row) => {
                  const latestLesson = lessons
                    .filter(
                      (lesson) =>
                        lesson.booked_by === row.student_id &&
                        lesson.display_status === "completed"
                    )
                    .sort(
                      (a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime()
                    )[0];
                  const latestPerformance = signups
                    .filter(
                      (signup) =>
                        signup.student_id === row.student_id && signup.status === "performed"
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.studio_class?.start_time ?? 0).getTime() -
                        new Date(a.studio_class?.start_time ?? 0).getTime()
                    )[0];

                  return (
                    <TR key={row.student_id}>
                      <TD className="font-medium text-neutral-900">
                        <Link href={`/admin/students/${row.student_id}`} className="hover:underline">
                          {row.full_name}
                        </Link>
                      </TD>
                      <TD>{row.email}</TD>
                      <TD className="text-right font-semibold tabular-nums text-neutral-900">
                        {row.completed_lessons}
                      </TD>
                      <TD className="text-right font-semibold tabular-nums text-neutral-900">
                        {row.performances}
                      </TD>
                      <TD>{latestLesson ? formatDate(latestLesson.start_time) : "—"}</TD>
                      <TD>
                        {latestPerformance?.studio_class
                          ? formatDate(latestPerformance.studio_class.start_time)
                          : "—"}
                      </TD>
                      <TD className="text-right">
                        <ProfileStatusBadge status={row.status} />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <EmptyState
              title="No statistics"
              body="Student statistics appear once the semester has students."
            />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
