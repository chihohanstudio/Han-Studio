import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { isFrontendPreviewEnabled } from "@/lib/preview";

export function isSupabaseConfigured() {
  if (isFrontendPreviewEnabled()) {
    return true;
  }

  return hasRealSupabasePublicConfig();
}

export function hasSupabaseServiceRole() {
  if (isFrontendPreviewEnabled()) {
    return true;
  }

  return hasRealSupabaseServiceRole();
}

export function hasRealSupabaseConfig() {
  return hasRealSupabasePublicConfig() && hasRealSupabaseServiceRole();
}

function hasRealSupabasePublicConfig() {
  return Boolean(
    isRealValue(process.env.NEXT_PUBLIC_SUPABASE_URL, "your-project") &&
      isRealValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "your-anon-key")
  );
}

function hasRealSupabaseServiceRole() {
  return isRealValue(process.env.SUPABASE_SERVICE_ROLE_KEY, "your-service-role-key");
}

function isRealValue(value: string | undefined, placeholder: string) {
  return Boolean(value && value.trim() && !value.includes(placeholder));
}

function requirePublicConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and anon key are required.");
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Replace the placeholder Supabase URL and anon key in .env.local.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = requirePublicConfig();
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server components cannot set cookies; middleware and actions can.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Server components cannot set cookies; middleware and actions can.
        }
      }
    }
  });
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL and service role key are required.");
  }

  if (!isSupabaseConfigured() || !hasSupabaseServiceRole()) {
    throw new Error("Replace the placeholder Supabase values in .env.local.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function getSiteUrl() {
  const origin = headers().get("origin");
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    origin ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
