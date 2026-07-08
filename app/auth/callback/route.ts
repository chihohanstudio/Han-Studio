import { NextResponse, type NextRequest } from "next/server";
import { ensureProfileForAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  try {
    if (!code) {
      throw new Error("Missing auth code.");
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

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

    const destination = profile.role === "admin" ? "/admin/dashboard" : "/student/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete sign in.";
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(redirectUrl);
  }
}
