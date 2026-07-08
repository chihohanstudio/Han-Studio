import type { ReactNode } from "react";

export function PageHeader({
  title,
  action
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b border-line pb-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-neutral-900 md:text-[32px]">
          {title}
        </h1>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
    </header>
  );
}
