import { setPassword } from "@/app/actions";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PageMessage } from "@/components/ui/message";
import { requireProfile } from "@/lib/auth";

export default async function SetPasswordPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string };
}) {
  const { user } = await requireProfile();

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <section className="w-full max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
        <LogoMark size="lg" />
        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-neutral-500">Account setup</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">Set your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Your IU email has been verified for {user.email}. Use this password whenever you sign in.
        </p>

        <div className="mt-6">
          <PageMessage searchParams={searchParams} />
        </div>

        <form action={setPassword} className="mt-6 flex flex-col gap-4">
          <Field label="New password" htmlFor="new-password" helper="At least 10 characters">
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </Field>
          <Field label="Confirm password" htmlFor="password-confirmation">
            <Input
              id="password-confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </Field>
          <Button type="submit">Save password</Button>
        </form>
      </section>
    </main>
  );
}
