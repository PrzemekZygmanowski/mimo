import type { APIRoute } from "astro";
import { logError } from "../../../lib/logger";
import { loginSchema } from "../../../lib/validation/auth-schemas";

export const prerender = false;

/**
 * POST /api/auth/login
 * Handles user login with email and password
 *
 * Request: JSON with email and password fields
 * Responses:
 * - 200: Login successful { success: true }
 * - 400: Validation error or authentication failed { error: string }
 * - 500: Server error { error: string }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse JSON body
    const body = await request.json();
    const { email, password } = body;

    // Validate input with Zod
    const validationResult = loginSchema.safeParse({ email, password });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const errorMessage = errors.email?.[0] || errors.password?.[0] || "Nieprawidłowe dane logowania";

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email: validatedEmail, password: validatedPassword } = validationResult.data;

    // Attempt to sign in with Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: validatedEmail,
      password: validatedPassword,
    });

    if (error) {
      logError("Login error", error);

      // Map Supabase errors to user-friendly Polish messages
      let errorMessage = "Wystąpił błąd podczas logowania. Spróbuj ponownie.";

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy e-mail lub hasło";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Potwierdź swoje konto klikając w link wysłany na e-mail";
      } else if (error.message.includes("Email not verified")) {
        errorMessage = "Potwierdź swoje konto klikając w link wysłany na e-mail";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: "Błąd logowania" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success - cookies are automatically set by @supabase/ssr
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError("Unexpected error in POST /api/auth/login", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
