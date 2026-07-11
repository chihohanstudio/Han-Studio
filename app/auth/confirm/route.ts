import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supportedEmailTypes = new Set<EmailOtpType>(["email", "invite", "recovery", "signup"]);

function safePath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : null;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  try {
    if (!tokenHash || !type || !supportedEmailTypes.has(type)) {
      throw new Error("Missing auth token.");
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type
    });

    if (error) {
      throw error;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.email) {
      throw new Error("Could not resolve authenticated user.");
    }

    const profile = await ensureProfileForAuthenticatedUser(user.id, user.email);

    if (profile.status !== "active") {
      await supabase.auth.signOut();
      throw new Error("This account has been archived.");
    }

    const dashboard = profile.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
    const destination = type === "invite" || type === "recovery" ? "/auth/set-password" : safePath(requestUrl.searchParams.get("next")) || dashboard;
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete sign in.";
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }
}
