import type { APIRoute } from "astro";
import { logError } from "../../../lib/logger";
import { registerSchema } from "../../../lib/validation/auth-schemas";

export const prerender = false;

/**
 * POST /api/auth/register
 * Handles user registration with email and password
 *
 * Request: JSON with email, password, and confirmPassword fields
 * Responses:
 * - 200: Registration successful { success: true }
 * - 400: Validation error or registration failed { error: string }
 * - 500: Server error { error: string }
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse JSON body
    const body = await request.json();
    const { email, password, confirmPassword } = body;

    // Validate input with Zod
    const validationResult = registerSchema.safeParse({ email, password, confirmPassword });

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const errorMessage =
        errors.email?.[0] || errors.password?.[0] || errors.confirmPassword?.[0] || "Nieprawidłowe dane rejestracji";

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { email: validatedEmail, password: validatedPassword } = validationResult.data;

    // Attempt to sign up with Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email: validatedEmail,
      password: validatedPassword,
    });

    if (error) {
      logError("Registration error", error);

      // Map Supabase errors to user-friendly Polish messages
      let errorMessage = "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.";

      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik o podanym adresie e-mail już istnieje";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Hasło jest zbyt słabe. Użyj silniejszego hasła.";
      } else if (error.message.includes("email")) {
        errorMessage = "Podany adres e-mail jest nieprawidłowy";
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!data.user) {
      return new Response(JSON.stringify({ error: "Błąd rejestracji" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success - return success response
    // Note: The user will need to confirm their email before they can log in
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logError("Unexpected error in POST /api/auth/register", error);

    const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
