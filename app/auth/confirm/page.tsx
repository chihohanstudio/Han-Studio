import { verifyEmailLink } from "@/app/actions";
import { LogoMark } from "@/components/logo";
import { Button, ButtonLink } from "@/components/ui/button";

const supportedTypes = new Set(["email", "invite", "recovery", "signup"]);

export default function ConfirmEmailPage({
  searchParams
}: {
  searchParams?: { token_hash?: string; type?: string };
}) {
  const tokenHash = searchParams?.token_hash;
  const type = searchParams?.type;
  const isValidLink = Boolean(tokenHash && type && supportedTypes.has(type));

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-10">
      <section className="w-full max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
        <LogoMark size="lg" />
        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-neutral-500">Email verification</p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
          {isValidLink ? "Confirm your email" : "This link is incomplete"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {isValidLink
            ? "Continue to verify your IU email and finish setting up your account."
            : "Request a new invitation or password reset email, then open the newest link."}
        </p>

        {isValidLink ? (
          <form action={verifyEmailLink} className="mt-6">
            <input type="hidden" name="token_hash" value={tokenHash} />
            <input type="hidden" name="type" value={type} />
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        ) : (
          <ButtonLink href="/login" className="mt-6 w-full">
            Back to sign in
          </ButtonLink>
        )}
      </section>
    </main>
  );
}
