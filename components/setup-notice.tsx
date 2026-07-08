import { LogoMark } from "@/components/logo";

export function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-lg rounded-card border border-line bg-surface p-8 shadow-card">
        <LogoMark size="lg" />
        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-neutral-500">
          Setup required
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
          Connect Supabase before using the studio site.
        </h1>
        <p className="mt-3 text-sm text-neutral-700">
          Copy <code className="rounded bg-subtle px-1.5 py-0.5 text-13">.env.example</code> to{" "}
          <code className="rounded bg-subtle px-1.5 py-0.5 text-13">.env.local</code>, add the
          Supabase URL, anon key, and service-role key, then run the SQL migration in{" "}
          <code className="rounded bg-subtle px-1.5 py-0.5 text-13">supabase/migrations</code>.
        </p>
        <p className="mt-2 text-sm text-neutral-700">
          After that, sign in with{" "}
          <code className="rounded bg-subtle px-1.5 py-0.5 text-13">chihan@iu.edu</code> or{" "}
          <code className="rounded bg-subtle px-1.5 py-0.5 text-13">zhouding@iu.edu</code> to create
          the first admin profile from the seeded invitations.
        </p>
      </div>
    </main>
  );
}
