import type { APIRoute } from "astro";
import { logError, logInfo } from "../../../lib/logger";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Handles user logout
 *
 * Responses:
 * - 303: Redirect to login page after successful logout
 * - 500: Server error
 */
export const POST: APIRoute = async ({ locals, redirect, cookies }) => {
  try {
    // Check if user is authenticated
    if (!locals.user) {
      return redirect("/login", 303);
    }

    // Sign out from Supabase
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      logInfo(`Logout error: ${error.message}`);
    } else {
      logInfo("Logout successful");
    }

    // Clear all Supabase cookies manually as a fallback
    const cookieNames = ["sb-access-token", "sb-refresh-token", "sb-auth-token"];

    cookieNames.forEach(cookieName => {
      cookies.delete(cookieName, { path: "/" });
    });

    // Redirect to login page
    return redirect("/login", 303);
  } catch (error) {
    logError("Unexpected error in POST /api/auth/logout", error);
    // Fail safely - redirect to login anyway
    return redirect("/login", 303);
  }
};
