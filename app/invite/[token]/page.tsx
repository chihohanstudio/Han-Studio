import { LogoMark } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { PageMessage } from "@/components/ui/message";

export default function InvitePage({
  params,
  searchParams
}: {
  params: { token: string };
  searchParams?: { success?: string; error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-surface p-8 shadow-card">
        <LogoMark size="lg" />
        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-neutral-500">
          Invitation
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">
          Use your IU email to sign in.
        </h1>
        <p className="mt-3 text-sm text-neutral-700">
          Invitations are verified by email address — just sign in with the IU email that received
          this invite.
        </p>
        <p className="mt-2 break-all text-2xs text-neutral-300">Invite token: {params.token}</p>
        <div className="mt-6">
          <PageMessage searchParams={searchParams} />
        </div>
        <ButtonLink href="/login" className="w-full">
          Continue to login
        </ButtonLink>
      </div>
    </main>
  );
}
