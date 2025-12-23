import type { APIRoute } from "astro";
import { logError } from "../../../lib/logger";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Handles user logout
 *
 * Responses:
 * - 303: Redirect to login page after successful logout
 * - 500: Server error
 */
export const POST: APIRoute = async ({ locals, redirect }) => {
  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      logError("Logout error", error);
      // Even if there's an error, we redirect to login (fail safely)
    }

    // Redirect to login page
    return redirect("/login", 303);
  } catch (error) {
    logError("Unexpected error in POST /api/auth/logout", error);
    // Fail safely - redirect to login anyway
    return redirect("/login", 303);
  }
};
