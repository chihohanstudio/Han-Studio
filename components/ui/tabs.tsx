import Link from "next/link";

export type TabItem = {
  label: string;
  href: string;
  active: boolean;
  count?: number;
};

export function LinkTabs({ tabs, ariaLabel }: { tabs: TabItem[]; ariaLabel?: string }) {
  return (
    <nav
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-13 font-medium transition-colors ${
            tab.active ? "bg-ink text-white" : "text-neutral-700 hover:bg-subtle"
          }`}
        >
          {tab.label}
          {typeof tab.count === "number" ? (
            <span
              className={`rounded-full px-1.5 text-2xs tabular-nums ${
                tab.active ? "bg-white/20 text-white" : "bg-subtle text-neutral-500"
              }`}
            >
              {tab.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
