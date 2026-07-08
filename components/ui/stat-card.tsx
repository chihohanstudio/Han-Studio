import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  icon
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">{label}</p>
        {icon ? <span className="text-neutral-300">{icon}</span> : null}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-13 text-neutral-500">{hint}</p> : null}
    </section>
  );
}
