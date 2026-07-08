import type {
  InvitationStatus,
  LessonDisplayStatus,
  ProfileStatus,
  StudioClassStatus,
  StudioSignupStatus
} from "@/lib/types";

export type BadgeTone =
  | "open"
  | "booked"
  | "mine"
  | "neutral"
  | "pending"
  | "cancelled"
  | "warning";

const tones: Record<BadgeTone, string> = {
  open: "border-green-200 bg-green-50 text-green-700",
  booked: "border-blue-200 bg-blue-50 text-blue-700",
  mine: "border-ink-200 bg-ink-50 text-ink",
  neutral: "border-neutral-300 bg-neutral-100 text-neutral-500",
  pending: "border-purple-200 bg-purple-50 text-purple-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-700"
};

export function Badge({
  tone = "neutral",
  className = "",
  children
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function LessonStatusBadge({
  status,
  mine = false
}: {
  status: LessonDisplayStatus;
  mine?: boolean;
}) {
  if (mine && status === "booked") {
    return <Badge tone="mine">Mine</Badge>;
  }

  const map: Record<LessonDisplayStatus, { tone: BadgeTone; label: string }> = {
    available: { tone: "open", label: "Open" },
    booked: { tone: "booked", label: "Booked" },
    completed: { tone: "neutral", label: "Completed" },
    cancelled_by_student: { tone: "cancelled", label: "Cancelled" },
    cancelled_by_teacher: { tone: "cancelled", label: "Cancelled" }
  };

  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function SignupStatusBadge({ status }: { status: StudioSignupStatus }) {
  if (status === "signed_up") {
    return null;
  }

  const map: Record<Exclude<StudioSignupStatus, "signed_up">, { tone: BadgeTone; label: string }> = {
    withdrawn: { tone: "neutral", label: "Withdrawn" },
    performed: { tone: "open", label: "Performed" },
    not_performed: { tone: "warning", label: "Not performed" }
  };

  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  return status === "active" ? (
    <Badge tone="open">Active</Badge>
  ) : (
    <Badge tone="neutral">Archived</Badge>
  );
}

export function ClassStatusBadge({ status }: { status: StudioClassStatus }) {
  const map: Record<StudioClassStatus, { tone: BadgeTone; label: string }> = {
    upcoming: { tone: "booked", label: "Upcoming" },
    completed: { tone: "neutral", label: "Completed" },
    cancelled: { tone: "cancelled", label: "Cancelled" }
  };

  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const map: Record<InvitationStatus, { tone: BadgeTone; label: string }> = {
    pending: { tone: "warning", label: "Pending" },
    accepted: { tone: "open", label: "Accepted" },
    expired: { tone: "neutral", label: "Expired" }
  };

  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
