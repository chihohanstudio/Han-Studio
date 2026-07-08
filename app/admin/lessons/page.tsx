import { CalendarPlus, MoreHorizontal, Plus } from "lucide-react";
import {
  adminAssignLesson,
  adminCancelLesson,
  createLessonSlot,
  createLessonSlotsForDay
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { DaySection, SlotRow, groupSlotsByDay } from "@/components/lessons";
import { LessonStatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select } from "@/components/ui/form";
import { IconButtonLink } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { getActiveStudents, getCurrentSemester, getLessonSlots } from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LessonSlot, Profile } from "@/lib/types";

export default async function AdminLessonsPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string; modal?: string; slot?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireAdmin();
  const semester = await getCurrentSemester();
  const [slots, students] = semester
    ? await Promise.all([getLessonSlots(semester.id), getActiveStudents()])
    : [[], []];
  const days = groupSlotsByDay(slots);
  const manageSlot = searchParams?.slot
    ? slots.find((slot) => slot.id === searchParams.slot)
    : null;

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title="Lessons"
        description="Flexible one-hour slots. Assign students or cancel slots."
        action={
          <>
            <IconButtonLink
              href="/admin/lessons?modal=single-slot"
              aria-label="Create single lesson slot"
              title="Single slot"
              className="h-10 w-10"
            >
              <Plus size={18} aria-hidden="true" />
            </IconButtonLink>
            <IconButtonLink
              href="/admin/lessons?modal=batch-slots"
              variant="primary"
              aria-label="Create batch lesson slots"
              title="Batch slots"
              className="h-10 w-10"
            >
              <CalendarPlus size={18} aria-hidden="true" />
            </IconButtonLink>
          </>
        }
      />

      {!semester ? (
        <EmptyState
          title="No current semester"
          body="Create a semester from the admin dashboard first."
        />
      ) : days.length ? (
        <div className="flex flex-col gap-8">
          {days.map((day) => {
            const open = day.slots.filter((slot) => slot.status === "available").length;
            return (
              <DaySection
                key={day.key}
                heading={day.heading}
                meta={`${day.slots.length} slot${day.slots.length === 1 ? "" : "s"}${
                  open ? ` · ${open} open` : ""
                }`}
              >
                {day.slots.map((slot) => (
                  <SlotRow key={slot.id} slot={slot}>
                    <IconButtonLink
                      href={`/admin/lessons?slot=${slot.id}`}
                      aria-label={`Manage slot at ${formatDateTime(slot.start_time)}`}
                    >
                      <MoreHorizontal size={15} aria-hidden="true" />
                    </IconButtonLink>
                  </SlotRow>
                ))}
              </DaySection>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No lesson slots"
          body="Create single or batch slots for students to book."
          action={<ButtonLink href="/admin/lessons?modal=batch-slots">Batch slots</ButtonLink>}
        />
      )}

      {searchParams?.modal === "single-slot" ? <SingleSlotModal /> : null}
      {searchParams?.modal === "batch-slots" ? <BatchSlotsModal /> : null}
      {manageSlot ? <ManageSlotModal slot={manageSlot} students={students} /> : null}
    </AppShell>
  );
}

function ManageSlotModal({ slot, students }: { slot: LessonSlot; students: Profile[] }) {
  const status = slot.display_status ?? slot.status;
  const canAssign = slot.status === "available" || slot.status === "booked";
  const canCancel =
    slot.status === "available" || (slot.status === "booked" && status !== "completed");

  return (
    <Modal
      title="Manage lesson slot"
      description={formatDateTime(slot.start_time)}
      closeHref="/admin/lessons"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-subtle/60 px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">
              {slot.student?.full_name ?? "No student assigned"}
            </p>
            <p className="mt-0.5 text-13 text-neutral-500">
              {slot.location || "Location TBA"}
              {slot.notes ? ` · ${slot.notes}` : ""}
            </p>
          </div>
          <LessonStatusBadge status={status} />
        </div>

        {canAssign ? (
          <form action={adminAssignLesson} className="flex items-end gap-2">
            <input type="hidden" name="next" value="/admin/lessons" />
            <input type="hidden" name="slot_id" value={slot.id} />
            <div className="flex-1">
              <Field label={slot.status === "booked" ? "Reassign student" : "Assign student"} htmlFor="assign-student">
                <Select id="assign-student" name="student_id" required defaultValue="">
                  <option value="" disabled>
                    Choose a student…
                  </option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button type="submit" variant="secondary">
              Assign
            </Button>
          </form>
        ) : null}

        {canCancel ? (
          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            <form action={adminCancelLesson}>
              <input type="hidden" name="next" value="/admin/lessons" />
              <input type="hidden" name="slot_id" value={slot.id} />
              <Button type="submit" variant="danger">
                Cancel slot
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function SingleSlotModal() {
  return (
    <Modal
      title="Create lesson slot"
      description="Each lesson slot is one hour."
      closeHref="/admin/lessons"
    >
      <form action={createLessonSlot} className="flex flex-col gap-4">
        <input type="hidden" name="next" value="/admin/lessons" />
        <Field label="Start time" htmlFor="slot-start">
          <Input id="slot-start" name="start_time" type="datetime-local" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Location" htmlFor="slot-location" helper="Optional">
            <Input id="slot-location" name="location" placeholder="MA 405" />
          </Field>
          <Field label="Notes" htmlFor="slot-notes" helper="Optional">
            <Input id="slot-notes" name="notes" />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <ButtonLink href="/admin/lessons" variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit">Create slot</Button>
        </div>
      </form>
    </Modal>
  );
}

function BatchSlotsModal() {
  return (
    <Modal
      title="Batch create slots"
      description="One-hour slots are generated inside the chosen time range."
      closeHref="/admin/lessons"
    >
      <form action={createLessonSlotsForDay} className="flex flex-col gap-4">
        <input type="hidden" name="next" value="/admin/lessons" />
        <Field label="Date" htmlFor="batch-date">
          <Input id="batch-date" name="date" type="date" required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="From" htmlFor="batch-start">
            <Input id="batch-start" name="start_time" type="time" required />
          </Field>
          <Field label="Until" htmlFor="batch-end">
            <Input id="batch-end" name="end_time" type="time" required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Location" htmlFor="batch-location" helper="Optional">
            <Input id="batch-location" name="location" placeholder="MA 405" />
          </Field>
          <Field label="Notes" htmlFor="batch-notes" helper="Optional">
            <Input id="batch-notes" name="notes" />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <ButtonLink href="/admin/lessons" variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit">Create slots</Button>
        </div>
      </form>
    </Modal>
  );
}
