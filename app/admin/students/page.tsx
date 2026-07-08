import Link from "next/link";
import { Archive, ArchiveRestore, UserPlus } from "lucide-react";
import { archiveStudent, inviteStudents, restoreStudent } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { InvitationStatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Textarea } from "@/components/ui/form";
import { IconButton, IconButtonLink } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { LinkTabs } from "@/components/ui/tabs";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { SetupNotice } from "@/components/setup-notice";
import {
  getAllStudentStats,
  getCurrentSemester,
  getInvitations,
  getStudentRoster
} from "@/lib/data";
import { formatDate } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, StudentSemesterStats } from "@/lib/types";

const SEMESTER_LESSON_TARGET = 14;

export default async function AdminStudentsPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string; view?: string; modal?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireAdmin();
  const isArchiveView = searchParams?.view === "archived";
  const rosterStatus = isArchiveView ? "archived" : "active";
  const semester = await getCurrentSemester();
  const [students, invitations, stats] = await Promise.all([
    getStudentRoster(rosterStatus),
    getInvitations(),
    semester ? getAllStudentStats(semester.id) : []
  ]);
  const statsByStudent = new Map(stats.map((row) => [row.student_id, row]));
  const basePath = isArchiveView ? "/admin/students?view=archived" : "/admin/students";

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title="Students"
        description="Invite students, archive inactive accounts, and keep semester history."
        action={
          <IconButtonLink
            href={`${basePath}${isArchiveView ? "&" : "?"}modal=invite`}
            variant="primary"
            aria-label="Invite students"
            title="Invite students"
            className="h-10 w-10"
          >
            <UserPlus size={18} aria-hidden="true" />
          </IconButtonLink>
        }
      />

      <div className="mb-6">
        <LinkTabs
          ariaLabel="Roster filter"
          tabs={[
            { label: "Active", href: "/admin/students", active: !isArchiveView },
            {
              label: "Archive",
              href: "/admin/students?view=archived",
              active: isArchiveView
            }
          ]}
        />
      </div>

      <div className="flex flex-col gap-8">
        {students.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                stats={statsByStudent.get(student.id)}
                basePath={basePath}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={isArchiveView ? "No archived students" : "No students"}
            body={
              isArchiveView
                ? "Archived students will appear here."
                : "Invite students to start the roster."
            }
            action={
              isArchiveView ? null : (
                <ButtonLink href="/admin/students?modal=invite" size="sm">
                  Invite students
                </ButtonLink>
              )
            }
          />
        )}

        <Card>
          <CardHeader title="Invitation history" description="Access is invitation-only" />
          {invitations.length ? (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Invited</TH>
                  <TH className="text-right">Status</TH>
                </TR>
              </THead>
              <TBody>
                {invitations.map((invitation) => (
                  <TR key={invitation.id}>
                    <TD className="font-medium text-neutral-900">{invitation.full_name}</TD>
                    <TD>{invitation.email}</TD>
                    <TD>{formatDate(invitation.created_at)}</TD>
                    <TD className="text-right">
                      <InvitationStatusBadge status={invitation.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <p className="px-5 py-4 text-13 text-neutral-500">Saved invitations appear here.</p>
          )}
        </Card>
      </div>

      {searchParams?.modal === "invite" ? (
        <Modal
          title="Invite students"
          description="One student per line — name and IU email."
          closeHref={basePath}
        >
          <form action={inviteStudents} className="flex flex-col gap-4">
            <input type="hidden" name="next" value="/admin/students" />
            <Field
              label="Roster lines"
              htmlFor="invite-roster"
              helper="Example: Clara Schumann, cschumann@iu.edu"
            >
              <Textarea
                id="invite-roster"
                name="roster"
                required
                rows={6}
                placeholder={"Clara Schumann, cschumann@iu.edu\nFranz Liszt, fliszt@iu.edu"}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <ButtonLink href={basePath} variant="secondary">
                Cancel
              </ButtonLink>
              <Button type="submit">Save invitations</Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}

function StudentCard({
  student,
  stats,
  basePath
}: {
  student: Profile;
  stats?: StudentSemesterStats;
  basePath: string;
}) {
  const completed = stats?.completed_lessons ?? 0;
  const remaining = Math.max(SEMESTER_LESSON_TARGET - completed, 0);
  const progress = Math.min((completed / SEMESTER_LESSON_TARGET) * 100, 100);

  return (
    <article className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={student.full_name} />
          <div className="min-w-0">
            <Link
              href={`/admin/students/${student.id}`}
              className="block truncate text-sm font-semibold text-neutral-900 hover:underline"
            >
              {student.full_name}
            </Link>
            <p className="truncate text-13 text-neutral-500">{student.email}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {student.status === "archived" ? (
            <form action={restoreStudent}>
              <input type="hidden" name="next" value="/admin/students?view=archived" />
              <input type="hidden" name="student_id" value={student.id} />
              <IconButton
                type="submit"
                aria-label={`Restore ${student.full_name}`}
                title="Restore student"
              >
                <ArchiveRestore size={15} aria-hidden="true" />
              </IconButton>
            </form>
          ) : (
            <form action={archiveStudent}>
              <input type="hidden" name="next" value={basePath} />
              <input type="hidden" name="student_id" value={student.id} />
              <IconButton
                type="submit"
                variant="danger"
                aria-label={`Archive ${student.full_name}`}
                title="Archive student"
              >
                <Archive size={15} aria-hidden="true" />
              </IconButton>
            </form>
          )}
        </div>
      </header>

      <div>
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-neutral-500">Lessons this term</span>
          <span className="font-bold tabular-nums text-neutral-900">
            {completed}/{SEMESTER_LESSON_TARGET}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={SEMESTER_LESSON_TARGET}
          aria-label={`${completed} of ${SEMESTER_LESSON_TARGET} lessons completed`}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle"
        >
          <span className="block h-full rounded-full bg-ink" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1.5 text-2xs text-neutral-300">
          {remaining} remaining · {stats?.performances ?? 0} performance
          {(stats?.performances ?? 0) === 1 ? "" : "s"}
        </p>
      </div>
    </article>
  );
}
