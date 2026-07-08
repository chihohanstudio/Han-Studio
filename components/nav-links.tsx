"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  GraduationCap,
  History,
  LayoutDashboard,
  PlusCircle,
  Users,
  type LucideIcon
} from "lucide-react";

const icons = {
  dashboard: LayoutDashboard,
  students: Users,
  lessons: CalendarClock,
  "studio-classes": GraduationCap,
  analytics: BarChart3,
  book: PlusCircle,
  history: History
} satisfies Record<string, LucideIcon>;

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof icons;
};

export function NavLinks({ items, layout }: { items: NavItem[]; layout: "sidebar" | "topbar" }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active =
          pathname === item.href ||
          (pathname.startsWith(`${item.href}/`) &&
            !items.some((other) => other.href !== item.href && pathname.startsWith(other.href) && other.href.length > item.href.length));

        if (layout === "topbar") {
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-13 font-medium transition-colors ${
                active ? "bg-ink text-white" : "text-neutral-700 hover:bg-subtle"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {item.label}
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-13 font-medium transition-colors ${
              active
                ? "bg-subtle text-neutral-900"
                : "text-neutral-700 hover:bg-subtle/60 hover:text-neutral-900"
            }`}
          >
            <Icon size={16} aria-hidden="true" className={active ? "text-neutral-900" : "text-neutral-500"} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
