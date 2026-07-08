import { ArrowRight } from "lucide-react";
import { requestMagicLink, startFrontendPreview } from "@/app/actions";
import { LogoMark } from "@/components/logo";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PageMessage } from "@/components/ui/message";
import { isFrontendPreviewEnabled } from "@/lib/preview";
import { hasSupabaseServiceRole, isSupabaseConfigured } from "@/lib/supabase/server";

export default function LoginPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string };
}) {
  const previewEnabled = isFrontendPreviewEnabled();

  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    return <SetupNotice />;
  }

  return (
    <main className="flex min-h-screen bg-page">
      <section
        aria-label="Chi Ho Han Studio"
        className="hidden flex-1 flex-col justify-between bg-subtle px-12 py-10 lg:flex xl:px-20"
      >
        <LogoMark size="lg" />

        <div>
          <h1 className="font-serif text-[clamp(56px,7vw,96px)] font-normal leading-[1.02] tracking-tight text-neutral-900">
            Chi Ho Han
          </h1>
          <p className="mt-3 font-serif text-[clamp(24px,2.6vw,36px)] italic leading-tight text-neutral-700">
            Studio Scheduling
          </p>
          <p className="mt-6 font-serif text-base italic text-neutral-500">
            Indiana University – Jacobs School of Music
          </p>
        </div>

        <p className="text-13 text-neutral-500">
          Lesson booking · Studio class signup · Semester statistics
        </p>
      </section>

      <section className="flex w-full flex-col justify-center border-line bg-surface px-6 py-12 sm:px-12 lg:w-[440px] lg:shrink-0 lg:border-l">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <LogoMark size="lg" />
            <h1 className="mt-6 font-serif text-4xl font-normal leading-tight text-neutral-900">
              Chi Ho Han
            </h1>
            <p className="mt-1 font-serif text-xl italic text-neutral-700">Studio Scheduling</p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Sign in</h2>
          <p className="mt-1.5 font-serif text-sm italic text-neutral-500">
            Invitation only · IU email
          </p>

          <div className="mt-6">
            <PageMessage searchParams={searchParams} />
          </div>

          <form action={requestMagicLink} className="flex flex-col gap-4">
            <Field label="Email" htmlFor="login-email" helper="Use your IU email address">
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="username@iu.edu"
                autoComplete="email"
                required
              />
            </Field>
            <Button type="submit">
              Send login link
              <ArrowRight size={15} aria-hidden="true" />
            </Button>
          </form>

          <p className="mt-4 text-2xs leading-relaxed text-neutral-500">
            Every account must be invited before logging in. You will receive a magic link at your
            IU email — no password needed.
          </p>

          {previewEnabled ? (
            <div className="mt-10 rounded-card border border-line bg-subtle/60 p-4">
              <p className="text-2xs font-medium uppercase tracking-wider text-neutral-500">
                Frontend preview
              </p>
              <p className="mt-1 text-13 text-neutral-500">
                Review the interface with mock data before Supabase is connected.
              </p>
              <div className="mt-3 flex gap-2">
                <form action={startFrontendPreview} className="flex-1">
                  <input type="hidden" name="role" value="admin" />
                  <Button type="submit" variant="secondary" size="sm" className="w-full">
                    Admin preview
                  </Button>
                </form>
                <form action={startFrontendPreview} className="flex-1">
                  <input type="hidden" name="role" value="student" />
                  <Button type="submit" variant="secondary" size="sm" className="w-full">
                    Student preview
                  </Button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
