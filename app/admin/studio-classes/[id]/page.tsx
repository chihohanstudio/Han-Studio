import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleX } from "lucide-react";
import { adminMarkNotPerformed, adminMarkPerformed, adminUpdateStudioClass } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { ClassStatusBadge, SignupStatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { IconButton } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { PageHeader } from "@/components/ui/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { getStudioClassById, getStudioSignupsForClass } from "@/lib/data";
import { formatDateTime, toDateTimeLocalInput } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AdminStudioClassDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { success?: string; error?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireAdmin();
  const [classItem, signups] = await Promise.all([
    getStudioClassById(params.id),
    getStudioSignupsForClass(params.id)
  ]);

  if (!classItem) {
    notFound();
  }

  const nextPath = `/admin/studio-classes/${classItem.id}`;

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
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
            <ButtonLink href="/admin/studio-classes" variant="secondary" size="sm">
              <ArrowLeft size={14} aria-hidden="true" />
              All classes
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="self-start">
          <CardHeader title="Class details" />
          <CardBody>
            <form action={adminUpdateStudioClass} className="flex flex-col gap-4">
              <input type="hidden" name="next" value={nextPath} />
              <input type="hidden" name="class_id" value={classItem.id} />
              <Field label="Title" htmlFor="class-title">
                <Input id="class-title" name="title" defaultValue={classItem.title} required />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start" htmlFor="class-start">
                  <Input
                    id="class-start"
                    name="start_time"
                    type="datetime-local"
                    defaultValue={toDateTimeLocalInput(classItem.start_time)}
                    required
                  />
                </Field>
                <Field label="End" htmlFor="class-end">
                  <Input
                    id="class-end"
                    name="end_time"
                    type="datetime-local"
                    defaultValue={toDateTimeLocalInput(classItem.end_time)}
                    required
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Location" htmlFor="class-location">
                  <Input id="class-location" name="location" defaultValue={classItem.location ?? ""} />
                </Field>
                <Field label="Status" htmlFor="class-status">
                  <Select id="class-status" name="status" defaultValue={classItem.status}>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </Field>
              </div>
              <Field label="Notes" htmlFor="class-notes" helper="Optional">
                <Textarea id="class-notes" name="notes" defaultValue={classItem.notes ?? ""} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader
            title="Performance signups"
            description="Mark each signup after the class ends"
          />
          {signups.length ? (
            <ul className="divide-y divide-line">
              {signups.map((signup) => {
                const name = signup.student?.full_name ?? "Student";
                const withdrawn = signup.status === "withdrawn";
                return (
                  <li
                    key={signup.id}
                    className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3 ${
                      withdrawn ? "bg-neutral-50" : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={name} />
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            withdrawn ? "text-neutral-500" : "text-neutral-900"
                          }`}
                        >
                          {name}
                        </p>
                        <p className="mt-0.5 text-13 text-neutral-500">
                          {signup.composer}: {signup.piece_title}
                          {signup.movement_or_section ? `, ${signup.movement_or_section}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <SignupStatusBadge status={signup.status} />
                      {!withdrawn ? (
                        <>
                          {signup.status !== "performed" ? (
                            <form action={adminMarkPerformed}>
                              <input type="hidden" name="next" value={nextPath} />
                              <input type="hidden" name="signup_id" value={signup.id} />
                              <IconButton
                                type="submit"
                                aria-label={`Mark ${name} performed`}
                                title="Mark performed"
                              >
                                <CheckCircle2 size={15} aria-hidden="true" />
                              </IconButton>
                            </form>
                          ) : null}
                          {signup.status !== "not_performed" ? (
                            <form action={adminMarkNotPerformed}>
                              <input type="hidden" name="next" value={nextPath} />
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
              })}
            </ul>
          ) : (
            <CardBody>
              <p className="text-13 text-neutral-500">No signups yet.</p>
            </CardBody>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
