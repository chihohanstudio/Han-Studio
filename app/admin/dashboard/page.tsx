import {
  CalendarClock,
  CalendarPlus,
  GraduationCap,
  Music,
  Users
} from "lucide-react";
import { createSemester, setCurrentSemester } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { SlotRow } from "@/components/lessons";
import { Badge, ClassStatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/form";
import { IconButtonLink } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SetupNotice } from "@/components/setup-notice";
import {
  getAdminDashboardStats,
  getCurrentSemester,
  getSemesters,
  getUpcomingLessonSlots,
  getUpcomingStudioClasses
} from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string; modal?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireAdmin();
  const [semester, semesters] = await Promise.all([getCurrentSemester(), getSemesters()]);
  const [stats, upcomingLessons, upcomingClasses] = semester
    ? await Promise.all([
        getAdminDashboardStats(semester.id),
        getUpcomingLessonSlots(semester.id, 6),
        getUpcomingStudioClasses(semester.id, 3)
      ])
    : [null, [], []];

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title="Dashboard"
        description={
          semester
            ? `${semester.name} · ${formatDate(semester.start_date)} – ${formatDate(semester.end_date)}`
            : "Create a current semester to begin."
        }
        action={
          <IconButtonLink
            href="/admin/dashboard?modal=semester"
            variant="primary"
            aria-label="Create or manage semesters"
            title="Create semester"
            className="h-10 w-10"
          >
            <CalendarPlus size={18} aria-hidden="true" />
          </IconButtonLink>
        }
      />

      {semester && stats ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Active students"
              value={stats.activeStudents}
              icon={<Users size={18} aria-hidden="true" />}
            />
            <StatCard
              label="Upcoming lessons"
              value={stats.upcomingLessons}
              icon={<CalendarClock size={18} aria-hidden="true" />}
            />
            <StatCard
              label="Completed lessons"
              value={stats.completedLessons}
              icon={<CalendarClock size={18} aria-hidden="true" />}
            />
            <StatCard
              label="Studio classes"
              value={stats.upcomingStudioClasses}
              icon={<GraduationCap size={18} aria-hidden="true" />}
            />
            <StatCard
              label="Performances"
              value={stats.performances}
              icon={<Music size={18} aria-hidden="true" />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Upcoming lessons"
                action={
                  <ButtonLink href="/admin/lessons" variant="secondary" size="sm">
                    Manage
                  </ButtonLink>
                }
              />
              {upcomingLessons.length ? (
                <div className="divide-y divide-line">
                  {upcomingLessons.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} meta={undefined}>
                      <span className="text-2xs text-neutral-500">
                        {formatDate(slot.start_time)}
                      </span>
                    </SlotRow>
                  ))}
                </div>
              ) : (
                <CardBody>
                  <p className="text-13 text-neutral-500">
                    No upcoming lessons. Create lesson slots for students to book.
                  </p>
                </CardBody>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Next studio classes"
                action={
                  <ButtonLink href="/admin/studio-classes" variant="secondary" size="sm">
                    Manage
                  </ButtonLink>
                }
              />
              {upcomingClasses.length ? (
                <ul className="divide-y divide-line">
                  {upcomingClasses.map((classItem) => (
                    <li
                      key={classItem.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900">{classItem.title}</p>
                        <p className="mt-0.5 text-13 text-neutral-500">
                          {formatDateTime(classItem.start_time)}
                          {classItem.location ? ` · ${classItem.location}` : ""}
                        </p>
                      </div>
                      <ClassStatusBadge status={classItem.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <CardBody>
                  <p className="text-13 text-neutral-500">
                    No upcoming studio class. Create the next weekly class.
                  </p>
                </CardBody>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No current semester"
          body="Create a semester to start publishing lessons and studio classes."
          action={<ButtonLink href="/admin/dashboard?modal=semester">Create semester</ButtonLink>}
        />
      )}

      {searchParams?.modal === "semester" ? (
        <Modal
          title="Semesters"
          description="Only one semester is current at a time."
          closeHref="/admin/dashboard"
        >
          <div className="flex flex-col gap-5">
            {semesters.length ? (
              <ul className="divide-y divide-line rounded-card border border-line">
                {semesters.map((row) => (
                  <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{row.name}</p>
                      <p className="mt-0.5 text-13 text-neutral-500">Semester schedule group</p>
                    </div>
                    {row.is_current ? (
                      <Badge tone="open">Current</Badge>
                    ) : (
                      <form action={setCurrentSemester}>
                        <input type="hidden" name="next" value="/admin/dashboard" />
                        <input type="hidden" name="semester_id" value={row.id} />
                        <Button type="submit" variant="secondary" size="sm">
                          Set current
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}

            <form action={createSemester} className="flex flex-col gap-4">
              <input type="hidden" name="next" value="/admin/dashboard" />
              <Field label="Name" htmlFor="semester-name">
                <Input id="semester-name" name="name" placeholder="Fall 2027" required />
              </Field>
              <label className="flex items-center gap-2 text-13 text-neutral-700">
                <input
                  name="is_current"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-line-strong text-ink accent-[#1c1c1c]"
                />
                Make this the current semester
              </label>
              <div className="flex justify-end">
                <Button type="submit">Create semester</Button>
              </div>
            </form>
          </div>
        </Modal>
      ) : null}
    </AppShell>
  );
}
