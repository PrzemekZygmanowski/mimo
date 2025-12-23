import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { AstroCookies } from "astro";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please create a .env file with SUPABASE_URL and SUPABASE_KEY."
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
export const createSupabaseBrowserClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// DEPRECATED: For backward compatibility with existing API endpoints
// Use context.locals.supabase in Astro routes instead
// This will be removed in future refactoring
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type export for backward compatibility
export type SupabaseClient = ReturnType<typeof createSupabaseServerInstance>;
