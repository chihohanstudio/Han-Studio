import type { ReactNode } from "react";
import { STUDIO_TIME_ZONE, formatTime } from "@/lib/datetime";
import type { LessonSlot } from "@/lib/types";
import { LessonStatusBadge } from "@/components/ui/badge";

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STUDIO_TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric"
});

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STUDIO_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function formatDayHeading(value: string | Date) {
  return dayFormatter.format(new Date(value));
}

export function groupSlotsByDay(slots: LessonSlot[]) {
  const groups = new Map<string, { heading: string; slots: LessonSlot[] }>();

  for (const slot of slots) {
    const key = dayKeyFormatter.format(new Date(slot.start_time));
    const group = groups.get(key) ?? { heading: formatDayHeading(slot.start_time), slots: [] };
    group.slots.push(slot);
    groups.set(key, group);
  }

  return Array.from(groups.entries()).map(([key, group]) => ({ key, ...group }));
}

export function DaySection({
  heading,
  meta,
  action,
  children
}: {
  heading: string;
  meta?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <header className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">{heading}</h2>
          {meta ? <p className="mt-0.5 text-13 text-neutral-500">{meta}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {children}
      </div>
    </section>
  );
}

export function SlotRow({
  slot,
  mine = false,
  meta,
  children
}: {
  slot: LessonSlot;
  mine?: boolean;
  meta?: ReactNode | null;
  children?: ReactNode;
}) {
  const status = slot.display_status ?? slot.status;
  const isPast = ["completed", "cancelled_by_student", "cancelled_by_teacher"].includes(status);
  const metaText =
    meta !== undefined
      ? meta
      : slot.student?.full_name ?? (status === "available" ? "Available" : null);

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 ${isPast ? "bg-neutral-50" : "bg-surface"}`}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className={`text-[15px] font-semibold tabular-nums ${isPast ? "text-neutral-500" : "text-neutral-900"}`}
        >
          {formatTime(slot.start_time)}
        </span>
        <LessonStatusBadge status={status} mine={mine} />
        <span className="truncate text-13 text-neutral-500">
          {metaText}
          {metaText && slot.location ? " · " : ""}
          {slot.location ?? ""}
        </span>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
