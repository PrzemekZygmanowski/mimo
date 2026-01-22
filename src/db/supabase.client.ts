import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types.ts";

// Server-side environment variables (available in .astro files and API routes)
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Client-side environment variables (available in client:* components)
// These must be prefixed with PUBLIC_ in Astro
const publicSupabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please create a .env file with SUPABASE_URL and SUPABASE_KEY."
  );
}

if (!publicSupabaseUrl || !publicSupabaseAnonKey) {
  throw new Error(
    "Missing public Supabase environment variables. Please add PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY to your .env file."
  );
}

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map(cookie => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Browser client for React components (client-side)
// Uses PUBLIC_ prefixed environment variables that are accessible on the client
export const createSupabaseBrowserClient = () => {
  return createClient<Database>(publicSupabaseUrl, publicSupabaseAnonKey);
};

// DEPRECATED: For backward compatibility with existing API endpoints
// Use context.locals.supabase in Astro routes instead
// This will be removed in future refactoring
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type export for backward compatibility
export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
