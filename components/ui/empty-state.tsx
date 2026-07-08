import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      {body ? <p className="max-w-sm text-13 text-neutral-500">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
