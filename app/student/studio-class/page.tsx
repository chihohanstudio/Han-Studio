import { Pencil, Plus } from "lucide-react";
import { signUpForStudioClass, withdrawStudioClassSignup } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { ClassStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/form";
import { IconButtonLink } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentSemester, getStudioClasses, getStudioSignupsForSemester } from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireStudent } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";
import type { StudioClass, StudioClassSignup } from "@/lib/types";

export default async function StudentStudioClassPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string; signup?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireStudent();
  const semester = await getCurrentSemester();
  const [classes, signups] = semester
    ? await Promise.all([getStudioClasses(semester.id), getStudioSignupsForSemester(semester.id)])
    : [[], []];
  const signupClass = searchParams?.signup
    ? classes.find((classItem) => classItem.id === searchParams.signup)
    : null;
  const signupClassCanEdit = signupClass
    ? signupClass.status === "upcoming" && new Date(signupClass.end_time) > new Date()
    : false;
  const signupClassOwnSignup = signupClass
    ? signups.find(
        (signup) => signup.studio_class_id === signupClass.id && signup.student_id === profile.id
      )
    : null;

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title="Studio Class"
        description="Performing is optional. Everyone can see the submitted repertoire."
      />

      {!semester ? (
        <EmptyState
          title="No current semester"
          body="Studio classes appear after an admin creates a semester."
        />
      ) : classes.length ? (
        <div className="flex flex-col gap-6">
          {classes.map((classItem) => {
            const classSignups = signups.filter(
              (signup) => signup.studio_class_id === classItem.id
            );
            const visibleSignups = classSignups.filter((signup) => signup.status !== "withdrawn");
            const ownSignup = classSignups.find((signup) => signup.student_id === profile.id);
            const canEdit =
              classItem.status === "upcoming" && new Date(classItem.end_time) > new Date();

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
                      {canEdit ? (
                        <IconButtonLink
                          href={`/student/studio-class?signup=${classItem.id}`}
                          aria-label={
                            ownSignup && ownSignup.status !== "withdrawn"
                              ? `Edit signup for ${classItem.title}`
                              : `Sign up for ${classItem.title}`
                          }
                          title={
                            ownSignup && ownSignup.status !== "withdrawn"
                              ? "Edit signup"
                              : "Sign up to perform"
                          }
                        >
                          {ownSignup && ownSignup.status !== "withdrawn" ? (
                            <Pencil size={15} aria-hidden="true" />
                          ) : (
                            <Plus size={15} aria-hidden="true" />
                          )}
                        </IconButtonLink>
                      ) : null}
                    </>
                  }
                />

                <CardBody className="flex flex-col gap-4">
                  {visibleSignups.length ? (
                    <ul className="divide-y divide-line">
                      {visibleSignups.map((signup) => (
                        <SignupItem key={signup.id} signup={signup} isOwn={signup.student_id === profile.id} />
                      ))}
                    </ul>
                  ) : (
                    <p className="py-1 text-13 text-neutral-500">No performance signups yet.</p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No studio classes"
          body="Weekly classes will appear here after an admin creates them."
        />
      )}

      {signupClass && signupClassCanEdit ? (
        <SignupModal classItem={signupClass} ownSignup={signupClassOwnSignup} />
      ) : null}
    </AppShell>
  );
}

function SignupItem({ signup, isOwn }: { signup: StudioClassSignup; isOwn: boolean }) {
  const name = signup.student?.full_name ?? "Student";

  return (
    <li className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar name={name} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {name}
            {isOwn ? <span className="ml-1.5 text-2xs font-medium text-neutral-500">(you)</span> : null}
          </p>
          <p className="mt-0.5 text-13 text-neutral-700">
            {signup.composer}: {signup.piece_title}
            {signup.movement_or_section ? `, ${signup.movement_or_section}` : ""}
            {signup.estimated_duration_minutes ? (
              <span className="text-neutral-500"> · {signup.estimated_duration_minutes} min</span>
            ) : null}
          </p>
          {signup.notes ? <p className="mt-0.5 text-2xs text-neutral-500">{signup.notes}</p> : null}
        </div>
      </div>
    </li>
  );
}

function SignupModal({
  classItem,
  ownSignup
}: {
  classItem: StudioClass;
  ownSignup?: StudioClassSignup | null;
}) {
  const activeSignup = ownSignup && ownSignup.status !== "withdrawn" ? ownSignup : null;

  return (
    <Modal
      title={activeSignup ? "Your performance" : "Sign up to perform"}
      description={formatDateTime(classItem.start_time)}
      closeHref="/student/studio-class"
    >
      <form action={signUpForStudioClass} className="flex flex-col gap-4">
        <input type="hidden" name="next" value="/student/studio-class" />
        <input type="hidden" name="studio_class_id" value={classItem.id} />
        {activeSignup ? <input type="hidden" name="signup_id" value={activeSignup.id} /> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Piece title" htmlFor={`piece-${classItem.id}`}>
            <Input
              id={`piece-${classItem.id}`}
              name="piece_title"
              defaultValue={activeSignup?.piece_title ?? ""}
              placeholder="Ballade No. 1 in G minor, Op. 23"
              required
            />
          </Field>
          <Field label="Composer" htmlFor={`composer-${classItem.id}`}>
            <Input
              id={`composer-${classItem.id}`}
              name="composer"
              defaultValue={activeSignup?.composer ?? ""}
              placeholder="Chopin"
              required
            />
          </Field>
          <Field label="Movement / section" htmlFor={`movement-${classItem.id}`} helper="Optional">
            <Input
              id={`movement-${classItem.id}`}
              name="movement_or_section"
              defaultValue={activeSignup?.movement_or_section ?? ""}
            />
          </Field>
          <Field
            label="Estimated duration"
            htmlFor={`duration-${classItem.id}`}
            helper="Minutes, optional"
          >
            <Input
              id={`duration-${classItem.id}`}
              name="estimated_duration_minutes"
              type="number"
              min="1"
              defaultValue={activeSignup?.estimated_duration_minutes ?? ""}
            />
          </Field>
        </div>
        <Field label="Notes" htmlFor={`notes-${classItem.id}`} helper="Optional">
          <Textarea id={`notes-${classItem.id}`} name="notes" defaultValue={activeSignup?.notes ?? ""} />
        </Field>
        <div className="flex items-center justify-end gap-2">
          {activeSignup ? (
            <Button
              type="submit"
              variant="danger"
              formAction={withdrawStudioClassSignup}
              formNoValidate
            >
              Withdraw
            </Button>
          ) : null}
          <Button type="submit">{activeSignup ? "Save changes" : "Sign up"}</Button>
        </div>
      </form>
    </Modal>
  );
}
