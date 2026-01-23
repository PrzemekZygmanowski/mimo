import type { SupabaseClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import type { Database } from "../../db/database.types";
import { logError } from "../../lib/logger";
import { getUserTasks } from "../../lib/services/userTasksService";

export const prerender = false;

// Schema for validating query parameters
const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .refine(val => val === undefined || (Number.isInteger(val) && val > 0), {
      message: "Page must be a positive integer",
    }),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .refine(val => val === undefined || (Number.isInteger(val) && val > 0 && val <= 100), {
      message: "Limit must be a positive integer between 1 and 100",
    }),
  status: z
    .string()
    .optional()
    .refine(val => val === undefined || ["pending", "completed", "skipped", "active"].includes(val), {
      message: "Status must be one of: pending, completed, skipped, active",
    }),
  date: z
    .string()
    .optional()
    .refine(
      val => {
        if (!val) return true;
        // Validate ISO date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(val);
      },
      {
        message: "Date must be in ISO format (YYYY-MM-DD)",
      }
    ),
});

/**
 * GET /api/user-tasks
 *
 * Retrieves a list of user tasks for the authenticated user with optional filtering and pagination.
 *
 * Query Parameters:
 *   - page?: number (default: 1) - Page number for pagination
 *   - limit?: number (default: 10, max: 100) - Number of items per page
 *   - status?: string ('pending' | 'completed' | 'skipped' | 'active') - Filter by task status
 *   - date?: string (YYYY-MM-DD) - Filter by task date
 *
 * Responses:
 *   - 200: Returns an array of UserTaskDTO
 *   - 400: Invalid request parameters
 *   - 401: Unauthorized (user not authenticated)
 *   - 500: Internal Server Error
 */
export const GET: APIRoute = async ({ url, locals }) => {
  // Step 0: Cast Supabase client to Database-typed instance
  const supabase = locals.supabase as SupabaseClient<Database>;

  try {
    // Step 1: Authenticate user via Supabase auth
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Extract and validate query parameters
    const searchParams = url.searchParams;
    const queryParams = {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      date: searchParams.get("date") ?? undefined,
    };

    // Validate query parameters using Zod
    const validatedParams = querySchema.parse(queryParams);

    // Step 3: Fetch user tasks using service layer
    const tasks = await getUserTasks(supabase, user.id, {
      page: validatedParams.page,
      limit: validatedParams.limit,
      status: validatedParams.status,
      date: validatedParams.date,
    });

    // Step 4: Return tasks as JSON response
    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    // Handle validation errors
    if (err instanceof ZodError) {
      return new Response(JSON.stringify({ error: "Bad Request", details: err.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    logError("Error in GET /api/user-tasks", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
