import { ArrowLeft } from "lucide-react";
import { sendPasswordResetEmail } from "@/app/actions";
import { LogoMark } from "@/components/logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PageMessage } from "@/components/ui/message";

export default function ForgotPasswordPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <section className="w-full max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
        <LogoMark size="lg" />
        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-neutral-500">Account access</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">Reset password</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Enter the IU email associated with your active studio account.
        </p>

        <div className="mt-6">
          <PageMessage searchParams={searchParams} />
        </div>

        <form action={sendPasswordResetEmail} className="mt-6 flex flex-col gap-4">
          <Field label="Email" htmlFor="reset-email">
            <Input
              id="reset-email"
              name="email"
              type="email"
              placeholder="username@iu.edu"
              autoComplete="email"
              required
            />
          </Field>
          <Button type="submit">Send reset email</Button>
        </form>

        <ButtonLink href="/login" variant="ghost" size="sm" className="mt-4 px-0">
          <ArrowLeft size={14} aria-hidden="true" />
          Back to sign in
        </ButtonLink>
      </section>
    </main>
  );
}
