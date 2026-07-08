import Link from "next/link";
import { LogOut } from "lucide-react";
import { setCurrentSemester, signOut, startFrontendPreview } from "@/app/actions";
import { LogoMark } from "@/components/logo";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentSemester, getSemesters } from "@/lib/data";
import { isFrontendPreviewActive, isFrontendPreviewEnabled } from "@/lib/preview";
import type { Profile } from "@/lib/types";

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/lessons", label: "Lessons", icon: "lessons" },
  { href: "/admin/studio-classes", label: "Studio Classes", icon: "studio-classes" },
  { href: "/admin/analytics", label: "Analytics", icon: "analytics" }
];

const studentNav: NavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/student/lessons/book", label: "Book Lesson", icon: "book" },
  { href: "/student/lessons", label: "My Lessons", icon: "lessons" },
  { href: "/student/studio-class", label: "Studio Class", icon: "studio-classes" },
  { href: "/student/history", label: "History", icon: "history" }
];

export async function AppShell({
  profile,
  children
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const isAdmin = profile.role === "admin";
  const previewEnabled = isFrontendPreviewEnabled();
  const previewActive = isFrontendPreviewActive();
  const home = isAdmin ? "/admin/dashboard" : "/student/dashboard";
  const navItems = isAdmin ? adminNav : studentNav;
  const semester = await getCurrentSemester();
  const semesters = isAdmin ? await getSemesters() : [];

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="relative flex h-[64px] items-center gap-4 px-4 md:px-6">
          <Link href={home} className="flex min-w-0 items-center gap-3">
            <LogoMark />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold text-neutral-900">Chi Ho Han</span>
              <span className="block truncate text-2xs text-neutral-500">Studio Scheduling</span>
            </span>
          </Link>

          {semester && isAdmin ? (
            <details className="group absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
              <summary className="flex cursor-pointer list-none items-center rounded-full border border-line bg-subtle px-5 py-2 text-lg font-bold tracking-tight text-neutral-900 transition-colors hover:bg-neutral-100 [&::-webkit-details-marker]:hidden">
                {semester.name}
              </summary>
              <div className="absolute left-1/2 top-[calc(100%+10px)] w-64 -translate-x-1/2 rounded-card border border-line bg-surface p-2 shadow-pop">
                <p className="px-2 pb-2 pt-1 text-2xs font-medium uppercase tracking-wider text-neutral-400">
                  Switch semester
                </p>
                <div className="flex flex-col gap-1">
                  {semesters.map((row) =>
                    row.is_current ? (
                      <div
                        key={row.id}
                        className="flex items-center justify-between rounded-lg bg-subtle px-3 py-2 text-sm font-semibold text-neutral-900"
                      >
                        <span>{row.name}</span>
                        <span className="text-2xs font-medium uppercase tracking-wider text-neutral-400">
                          Current
                        </span>
                      </div>
                    ) : (
                      <form action={setCurrentSemester} key={row.id}>
                        <input type="hidden" name="next" value="/admin/dashboard" />
                        <input type="hidden" name="semester_id" value={row.id} />
                        <button
                          type="submit"
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 transition-colors hover:bg-subtle hover:text-neutral-900"
                        >
                          {row.name}
                        </button>
                      </form>
                    )
                  )}
                </div>
              </div>
            </details>
          ) : semester ? (
            <span className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-subtle px-5 py-2 text-lg font-bold tracking-tight text-neutral-900 sm:inline-flex">
              {semester.name}
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-3">
            <Avatar name={profile.full_name} size="sm" />
            <span className="hidden min-w-0 leading-tight md:block">
              <span className="block truncate text-13 font-semibold text-neutral-900">
                {profile.full_name}
              </span>
              <span className="block truncate text-2xs text-neutral-500">
                {isAdmin ? "Studio Faculty" : "Student"}
              </span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-neutral-700 transition-colors hover:bg-subtle hover:text-neutral-900"
              >
                <LogOut size={15} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden"
        >
          <NavLinks items={navItems} layout="topbar" />
        </nav>
      </header>

      <div className="flex flex-1">
        <aside className="sticky top-[60px] hidden h-[calc(100vh-60px)] w-56 shrink-0 flex-col border-r border-line bg-surface px-3 py-5 md:flex">
          <nav aria-label="Main navigation" className="flex flex-col gap-1">
            <NavLinks items={navItems} layout="sidebar" />
          </nav>

          <div className="flex-1" />

          {previewEnabled && previewActive ? (
            <div className="mb-2 rounded-xl border border-line bg-subtle/60 p-3">
              <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-neutral-500">
                Preview mode
              </p>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface p-1">
                {(["admin", "student"] as const).map((role) => (
                  <form action={startFrontendPreview} key={role}>
                    <input type="hidden" name="role" value={role} />
                    <button
                      type="submit"
                      className={`w-full rounded-md px-2 py-1 text-2xs font-medium capitalize transition-colors ${
                        (role === "admin") === isAdmin
                          ? "bg-ink text-white"
                          : "text-neutral-500 hover:text-neutral-900"
                      }`}
                    >
                      {role}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
