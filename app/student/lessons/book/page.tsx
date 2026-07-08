import { ArrowRightLeft, CalendarCheck, CalendarX } from "lucide-react";
import {
  acceptLessonExchange,
  bookLessonSlot,
  cancelLessonBooking,
  cancelLessonExchangeRequest,
  declineLessonExchange,
  requestLessonExchange
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { DaySection, SlotRow, groupSlotsByDay } from "@/components/lessons";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { IconButton, IconButtonLink } from "@/components/ui/icon-button";
import { PageMessage } from "@/components/ui/message";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SetupNotice } from "@/components/setup-notice";
import { getCurrentSemester, getLessonExchangeRequestsForStudent, getLessonSlots } from "@/lib/data";
import { formatDateTime } from "@/lib/datetime";
import { requireStudent } from "@/lib/auth";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LessonExchangeRequest, LessonSlot } from "@/lib/types";

const LESSON_CHANGE_WINDOW_MS = 24 * 60 * 60 * 1000;

export default async function BookLessonPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string; confirm?: string; cancel?: string; exchange?: string };
}) {
  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  const { profile } = await requireStudent();
  const semester = await getCurrentSemester();
  const [slots, exchangeRequests] = semester
    ? await Promise.all([
        getLessonSlots(semester.id).then((rows) =>
          rows.filter(
            (slot) =>
              new Date(slot.start_time) > new Date() &&
              (slot.status === "available" || slot.status === "booked")
          )
        ),
        getLessonExchangeRequestsForStudent(profile.id)
      ])
    : [[], []];
  const days = groupSlotsByDay(slots);
  const bookableSlots = slots.filter((slot) => slot.status === "available");
  const ownBookedSlots = slots.filter(
    (slot) => slot.status === "booked" && slot.booked_by === profile.id
  );
  const exchangeOfferSlots = ownBookedSlots.filter(canChangeLesson);
  const confirmSlot = searchParams?.confirm
    ? bookableSlots.find((slot) => slot.id === searchParams.confirm)
    : null;
  const cancelSlot = searchParams?.cancel
    ? ownBookedSlots.find((slot) => slot.id === searchParams.cancel && canChangeLesson(slot))
    : null;
  const exchangeSlot = searchParams?.exchange
    ? slots.find(
        (slot) =>
          slot.id === searchParams.exchange &&
          slot.status === "booked" &&
          Boolean(slot.booked_by) &&
          slot.booked_by !== profile.id &&
          canChangeLesson(slot)
      )
    : null;

  return (
    <AppShell profile={profile}>
      <PageMessage searchParams={searchParams} />
      <PageHeader
        title="Book Lesson"
        description="Every lesson is one hour. Pick any open slot — no approval needed."
      />

      {!semester ? (
        <EmptyState
          title="No current semester"
          body="Lesson slots appear after an admin creates a semester."
        />
      ) : days.length ? (
        <div className="flex flex-col gap-8">
          {exchangeRequests.length ? (
            <ExchangeRequestsPanel requests={exchangeRequests} studentId={profile.id} />
          ) : null}

          {days.map((day) => (
            <DaySection
              key={day.key}
              heading={day.heading}
              meta={formatAvailabilityMeta(day.slots)}
            >
              {day.slots.map((slot) => {
                const isOwnLesson = slot.booked_by === profile.id;
                const isOtherLesson =
                  slot.status === "booked" && Boolean(slot.booked_by) && !isOwnLesson;

                return (
                  <SlotRow key={slot.id} slot={slot} mine={isOwnLesson}>
                    {slot.status === "available" ? (
                      <IconButtonLink
                        href={`/student/lessons/book?confirm=${slot.id}`}
                        aria-label={`Book lesson at ${formatDateTime(slot.start_time)}`}
                        title="Book lesson"
                      >
                        <CalendarCheck size={15} aria-hidden="true" />
                      </IconButtonLink>
                    ) : null}
                    {isOwnLesson && canChangeLesson(slot) ? (
                      <IconButtonLink
                        href={`/student/lessons/book?cancel=${slot.id}`}
                        variant="danger"
                        aria-label={`Cancel lesson at ${formatDateTime(slot.start_time)}`}
                        title="Cancel lesson"
                      >
                        <CalendarX size={15} aria-hidden="true" />
                      </IconButtonLink>
                    ) : null}
                    {isOwnLesson && !canChangeLesson(slot) ? (
                      <span className="text-2xs text-neutral-300">Within 24h</span>
                    ) : null}
                    {isOtherLesson && canChangeLesson(slot) ? (
                      <IconButtonLink
                        href={`/student/lessons/book?exchange=${slot.id}`}
                        aria-label={`Request exchange for ${formatDateTime(slot.start_time)}`}
                        title="Request exchange"
                      >
                        <ArrowRightLeft size={15} aria-hidden="true" />
                      </IconButtonLink>
                    ) : null}
                  </SlotRow>
                );
              })}
            </DaySection>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No lesson slots"
          body="Published lesson slots will appear here."
        />
      )}

      {confirmSlot ? (
        <Modal
          title="Confirm booking"
          description="This one-hour slot will be reserved for you."
          closeHref="/student/lessons/book"
        >
          <div className="rounded-card border border-line bg-subtle/60 px-4 py-3">
            <p className="text-sm font-semibold text-neutral-900">
              {formatDateTime(confirmSlot.start_time)}
            </p>
            <p className="mt-0.5 text-13 text-neutral-500">
              {confirmSlot.location || "Location TBA"}
            </p>
            {confirmSlot.notes ? (
              <p className="mt-1 text-13 text-neutral-700">{confirmSlot.notes}</p>
            ) : null}
          </div>
          <form action={bookLessonSlot} className="mt-4 flex justify-end gap-2">
            <input type="hidden" name="next" value="/student/lessons/book" />
            <input type="hidden" name="slot_id" value={confirmSlot.id} />
            <ButtonLink href="/student/lessons/book" variant="secondary">
              Cancel
            </ButtonLink>
            <Button type="submit">Confirm booking</Button>
          </form>
        </Modal>
      ) : null}

      {cancelSlot ? <CancelLessonModal slot={cancelSlot} /> : null}

      {exchangeSlot ? (
        <ExchangeLessonModal targetSlot={exchangeSlot} offerSlots={exchangeOfferSlots} />
      ) : null}
    </AppShell>
  );
}

function ExchangeRequestsPanel({
  requests,
  studentId
}: {
  requests: LessonExchangeRequest[];
  studentId: string;
}) {
  const incoming = requests.filter((request) => request.requested_from === studentId);
  const outgoing = requests.filter((request) => request.requester_id === studentId);

  return (
    <Card>
      <CardHeader title="Exchange requests" />
      <CardBody className="flex flex-col gap-4">
        {incoming.length ? (
          <ExchangeRequestGroup title="Incoming" requests={incoming} direction="incoming" />
        ) : null}
        {outgoing.length ? (
          <ExchangeRequestGroup title="Sent" requests={outgoing} direction="outgoing" />
        ) : null}
      </CardBody>
    </Card>
  );
}

function ExchangeRequestGroup({
  title,
  requests,
  direction
}: {
  title: string;
  requests: LessonExchangeRequest[];
  direction: "incoming" | "outgoing";
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">{title}</h2>
      <ul className="divide-y divide-line rounded-card border border-line">
        {requests.map((request) => (
          <ExchangeRequestRow key={request.id} request={request} direction={direction} />
        ))}
      </ul>
    </section>
  );
}

function ExchangeRequestRow({
  request,
  direction
}: {
  request: LessonExchangeRequest;
  direction: "incoming" | "outgoing";
}) {
  const requesterName = request.requester?.full_name ?? "Student";
  const recipientName = request.requested_student?.full_name ?? "Student";
  const offeredTime = request.requester_slot
    ? formatDateTime(request.requester_slot.start_time)
    : "Offered lesson";
  const requestedTime = request.target_slot
    ? formatDateTime(request.target_slot.start_time)
    : "Requested lesson";

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900">
          {direction === "incoming"
            ? `${requesterName} requested your lesson`
            : `Waiting for ${recipientName}`}
        </p>
        <p className="mt-0.5 text-13 text-neutral-500">
          {direction === "incoming"
            ? `${requestedTime} for ${offeredTime}`
            : `${offeredTime} for ${requestedTime}`}
        </p>
        {request.message ? (
          <p className="mt-1 text-2xs text-neutral-500">{request.message}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {direction === "incoming" ? (
          <>
            <form action={acceptLessonExchange}>
              <input type="hidden" name="next" value="/student/lessons/book" />
              <input type="hidden" name="request_id" value={request.id} />
              <IconButton type="submit" aria-label="Accept exchange" title="Accept exchange">
                <CalendarCheck size={15} aria-hidden="true" />
              </IconButton>
            </form>
            <form action={declineLessonExchange}>
              <input type="hidden" name="next" value="/student/lessons/book" />
              <input type="hidden" name="request_id" value={request.id} />
              <IconButton
                type="submit"
                variant="danger"
                aria-label="Decline exchange"
                title="Decline exchange"
              >
                <CalendarX size={15} aria-hidden="true" />
              </IconButton>
            </form>
          </>
        ) : (
          <form action={cancelLessonExchangeRequest}>
            <input type="hidden" name="next" value="/student/lessons/book" />
            <input type="hidden" name="request_id" value={request.id} />
            <IconButton
              type="submit"
              variant="danger"
              aria-label="Cancel exchange request"
              title="Cancel request"
            >
              <CalendarX size={15} aria-hidden="true" />
            </IconButton>
          </form>
        )}
      </div>
    </li>
  );
}

function canChangeLesson(slot: LessonSlot) {
  return new Date(slot.start_time).getTime() > Date.now() + LESSON_CHANGE_WINDOW_MS;
}

function formatAvailabilityMeta(slots: Pick<LessonSlot, "status">[]) {
  const open = slots.filter((slot) => slot.status === "available").length;
  const booked = slots.filter((slot) => slot.status === "booked").length;
  const parts = [];

  if (open) {
    parts.push(`${open} open`);
  }

  if (booked) {
    parts.push(`${booked} booked`);
  }

  return parts.join(" · ");
}

function CancelLessonModal({ slot }: { slot: LessonSlot }) {
  return (
    <Modal
      title="Cancel this lesson?"
      description={formatDateTime(slot.start_time)}
      closeHref="/student/lessons/book"
    >
      <form action={cancelLessonBooking} className="flex flex-col gap-4">
        <input type="hidden" name="next" value="/student/lessons/book" />
        <input type="hidden" name="slot_id" value={slot.id} />
        <Field label="Reason" htmlFor="cancel-reason" helper="Optional">
          <Input id="cancel-reason" name="reason" placeholder="Schedule conflict..." />
        </Field>
        <div className="flex justify-end gap-2">
          <ButtonLink href="/student/lessons/book" variant="secondary">
            Keep lesson
          </ButtonLink>
          <Button type="submit" variant="danger">
            Cancel lesson
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ExchangeLessonModal({
  targetSlot,
  offerSlots
}: {
  targetSlot: LessonSlot;
  offerSlots: LessonSlot[];
}) {
  const targetStudent = targetSlot.student?.full_name ?? "this student";

  return (
    <Modal
      title="Request exchange"
      description={`${targetStudent} · ${formatDateTime(targetSlot.start_time)}`}
      closeHref="/student/lessons/book"
    >
      <div className="rounded-card border border-line bg-subtle/60 px-4 py-3">
        <p className="text-sm font-semibold text-neutral-900">
          {formatDateTime(targetSlot.start_time)}
        </p>
        <p className="mt-0.5 text-13 text-neutral-500">
          {targetSlot.student?.full_name ?? "Booked"}
          {targetSlot.location ? ` · ${targetSlot.location}` : ""}
        </p>
      </div>

      {offerSlots.length ? (
        <form action={requestLessonExchange} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="next" value="/student/lessons/book" />
          <input type="hidden" name="target_slot_id" value={targetSlot.id} />
          <Field label="Offer your lesson" htmlFor="offered-slot">
            <Select id="offered-slot" name="offered_slot_id" required defaultValue="">
              <option value="" disabled>
                Choose one of your lessons...
              </option>
              {offerSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {formatDateTime(slot.start_time)}
                  {slot.location ? ` · ${slot.location}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Message" htmlFor="exchange-message" helper="Optional">
            <Textarea
              id="exchange-message"
              name="message"
              rows={3}
              placeholder="Add a short note for the other student."
            />
          </Field>
          <div className="flex justify-end gap-2">
            <ButtonLink href="/student/lessons/book" variant="secondary">
              Cancel
            </ButtonLink>
            <Button type="submit">Send request</Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-13 text-neutral-500">
            You need one of your own booked lessons more than 24 hours away before requesting an exchange.
          </p>
          <div className="flex justify-end">
            <ButtonLink href="/student/lessons/book" variant="secondary">
              Close
            </ButtonLink>
          </div>
        </div>
      )}
    </Modal>
  );
}
