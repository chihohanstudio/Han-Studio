import { X } from "lucide-react";
import { cancelLessonBooking } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { DaySection, SlotRow, groupSlotsByDay } from "@/components/lessons";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/form";
import { IconButtonLink } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentSemester, getMyLessonSlots } from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireStudent } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LessonSlot } from "@/lib/types";

function canCancel(slot: LessonSlot) {
  return (
    slot.status === "booked" &&
    new Date(slot.start_time).getTime() > Date.now() + 24 * 60 * 60 * 1000
  );
}

export default async function MyLessonsPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string; cancel?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireStudent();
  const semester = await getCurrentSemester();
  const lessons = semester ? await getMyLessonSlots(semester.id, profile.id) : [];
  const upcoming = lessons
    .filter((slot) => new Date(slot.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  const past = lessons
    .filter((slot) => new Date(slot.start_time) < new Date())
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  const cancelSlot = searchParams?.cancel
    ? upcoming.find((slot) => slot.id === searchParams.cancel && canCancel(slot))
    : null;

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title="My Lessons"
        description="You can cancel a booked lesson up to 24 hours before it starts."
      />

      <div className="flex flex-col gap-10">
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Upcoming
          </h2>
          {upcoming.length ? (
            <div className="flex flex-col gap-8">
              {groupSlotsByDay(upcoming).map((day) => (
                <DaySection key={day.key} heading={day.heading}>
                  {day.slots.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} mine meta={null}>
                      {canCancel(slot) ? (
                        <IconButtonLink
                          href={`/student/lessons?cancel=${slot.id}`}
                          variant="danger"
                          aria-label={`Cancel lesson on ${formatDateTime(slot.start_time)}`}
                        >
                          <X size={15} aria-hidden="true" />
                        </IconButtonLink>
                      ) : slot.status === "booked" ? (
                        <span className="text-2xs text-neutral-300">Within 24h</span>
                      ) : null}
                    </SlotRow>
                  ))}
                </DaySection>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming lessons"
              body="Book an available slot to see it here."
              action={
                <ButtonLink href="/student/lessons/book" size="sm">
                  Book lesson
                </ButtonLink>
              }
            />
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-neutral-500">
            Past
          </h2>
          {past.length ? (
            <div className="flex flex-col gap-8">
              {groupSlotsByDay(past).map((day) => (
                <DaySection key={day.key} heading={day.heading}>
                  {day.slots.map((slot) => (
                    <SlotRow key={slot.id} slot={slot} meta={null} />
                  ))}
                </DaySection>
              ))}
            </div>
          ) : (
            <EmptyState title="No past lessons" body="Lesson history appears here." />
          )}
        </section>
      </div>

      {cancelSlot ? (
        <Modal
          title="Cancel this lesson?"
          description={formatDateTime(cancelSlot.start_time)}
          closeHref="/student/lessons"
        >
          <form action={cancelLessonBooking} className="flex flex-col gap-4">
            <input type="hidden" name="next" value="/student/lessons" />
            <input type="hidden" name="slot_id" value={cancelSlot.id} />
            <Field label="Reason" htmlFor="cancel-reason" helper="Optional — visible to the teacher">
              <Input id="cancel-reason" name="reason" placeholder="Schedule conflict…" />
            </Field>
            <div className="flex justify-end gap-2">
              <ButtonLink href="/student/lessons" variant="secondary">
                Keep lesson
              </ButtonLink>
              <Button type="submit" variant="danger">
                Cancel lesson
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </AppShell>
  );
}
