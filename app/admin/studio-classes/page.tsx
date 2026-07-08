import { CalendarPlus, CheckCircle2, CircleX, Pencil, XCircle } from "lucide-react";
import {
  adminCancelStudioClass,
  adminCreateStudioClass,
  adminMarkNotPerformed,
  adminMarkPerformed
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { ClassStatusBadge, SignupStatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/form";
import { IconButton, IconButtonLink } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentSemester, getStudioClasses, getStudioSignupsForSemester } from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";
import type { StudioClassSignup } from "@/lib/types";

export default async function AdminStudioClassesPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string; modal?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireAdmin();
  const semester = await getCurrentSemester();
  const [classes, signups] = semester
    ? await Promise.all([getStudioClasses(semester.id), getStudioSignupsForSemester(semester.id)])
    : [[], []];

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title="Studio Classes"
        description="Create weekly classes and mark performance outcomes after each one."
        action={
          <IconButtonLink
            href="/admin/studio-classes?modal=create-class"
            variant="primary"
            aria-label="Create studio class"
            title="Create class"
            className="h-10 w-10"
          >
            <CalendarPlus size={18} aria-hidden="true" />
          </IconButtonLink>
        }
      />

      {!semester ? (
        <EmptyState
          title="No current semester"
          body="Create a semester from the admin dashboard first."
        />
      ) : classes.length ? (
        <div className="flex flex-col gap-6">
          {classes.map((classItem) => {
            const classSignups = signups.filter(
              (signup) => signup.studio_class_id === classItem.id
            );

            return (
              <Card key={classItem.id}>
                <CardHeader
                  title={classItem.title}
                  description={
                    <>
                      {formatDateTime(classItem.start_time)}
                      {classItem.location ? ` · ${classItem.location}` : ""}
                    </>
                  }
                  action={
                    <>
                      <ClassStatusBadge status={classItem.status} />
                      <IconButtonLink
                        href={`/admin/studio-classes/${classItem.id}`}
                        aria-label={`Edit ${classItem.title}`}
                        title="Edit class"
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </IconButtonLink>
                      {classItem.status !== "cancelled" ? (
                        <form action={adminCancelStudioClass}>
                          <input type="hidden" name="next" value="/admin/studio-classes" />
                          <input type="hidden" name="class_id" value={classItem.id} />
                          <IconButton
                            type="submit"
                            variant="danger"
                            aria-label={`Cancel ${classItem.title}`}
                            title="Cancel class"
                          >
                            <XCircle size={15} aria-hidden="true" />
                          </IconButton>
                        </form>
                      ) : null}
                    </>
                  }
                />
                {classSignups.length ? (
                  <ul className="divide-y divide-line">
                    {classSignups.map((signup) => (
                      <AdminSignupRow key={signup.id} signup={signup} />
                    ))}
                  </ul>
                ) : (
                  <CardBody>
                    <p className="text-13 text-neutral-500">No performance signups yet.</p>
                  </CardBody>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No studio classes"
          body="Create the first weekly class for performance signups."
          action={
            <ButtonLink href="/admin/studio-classes?modal=create-class" size="sm">
              Create class
            </ButtonLink>
          }
        />
      )}

      {searchParams?.modal === "create-class" ? <CreateStudioClassModal /> : null}
    </AppShell>
  );
}

function AdminSignupRow({ signup }: { signup: StudioClassSignup }) {
  const name = signup.student?.full_name ?? "Student";
  const withdrawn = signup.status === "withdrawn";

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${
        withdrawn ? "bg-neutral-50" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${withdrawn ? "text-neutral-500" : "text-neutral-900"}`}>
            {name}
          </p>
          <p className="mt-0.5 text-13 text-neutral-500">
            {signup.composer}: {signup.piece_title}
            {signup.movement_or_section ? `, ${signup.movement_or_section}` : ""}
            {signup.estimated_duration_minutes ? ` · ${signup.estimated_duration_minutes} min` : ""}
          </p>
          {signup.notes ? <p className="mt-0.5 text-2xs text-neutral-300">{signup.notes}</p> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <SignupStatusBadge status={signup.status} />
        {!withdrawn ? (
          <>
            {signup.status !== "performed" ? (
              <form action={adminMarkPerformed}>
                <input type="hidden" name="next" value="/admin/studio-classes" />
                <input type="hidden" name="signup_id" value={signup.id} />
                <IconButton type="submit" aria-label={`Mark ${name} performed`} title="Mark performed">
                  <CheckCircle2 size={15} aria-hidden="true" />
                </IconButton>
              </form>
            ) : null}
            {signup.status !== "not_performed" ? (
              <form action={adminMarkNotPerformed}>
                <input type="hidden" name="next" value="/admin/studio-classes" />
                <input type="hidden" name="signup_id" value={signup.id} />
                <IconButton
                  type="submit"
                  variant="danger"
                  aria-label={`Mark ${name} not performed`}
                  title="Mark not performed"
                >
                  <CircleX size={15} aria-hidden="true" />
                </IconButton>
              </form>
            ) : null}
          </>
        ) : null}
      </div>
    </li>
  );
}

function CreateStudioClassModal() {
  return (
    <Modal
      title="Create studio class"
      description="A weekly class students can sign up to perform in."
      closeHref="/admin/studio-classes"
    >
      <form action={adminCreateStudioClass} className="flex flex-col gap-4">
        <input type="hidden" name="next" value="/admin/studio-classes" />
        <Field label="Title" htmlFor="class-title">
          <Input id="class-title" name="title" defaultValue="Studio Class" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start" htmlFor="class-start">
            <Input id="class-start" name="start_time" type="datetime-local" required />
          </Field>
          <Field label="End" htmlFor="class-end">
            <Input id="class-end" name="end_time" type="datetime-local" required />
          </Field>
        </div>
        <Field label="Location" htmlFor="class-location" helper="Optional">
          <Input id="class-location" name="location" placeholder="Ford-Crawford Hall" />
        </Field>
        <div className="flex justify-end gap-2">
          <ButtonLink href="/admin/studio-classes" variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit">Create class</Button>
        </div>
      </form>
    </Modal>
  );
}
