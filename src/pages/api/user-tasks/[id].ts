import type { SupabaseClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import type { Database } from "../../../db/database.types";
import { logError } from "../../../lib/logger";
import { getUserTaskById } from "../../../lib/services/userTasksService";

export const prerender = false;

// Schema for validating path parameter "id" and converting it to a number
const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform(val => parseInt(val, 10)),
});

// Schema for validating request body (used in PATCH)
const bodySchema = z.object({
  status: z.string().refine(val => ["pending", "completed", "skipped", "active"].includes(val), {
    message: "Invalid status value",
  }),
  new_task_requests: z.number().int().min(0).max(3).optional(),
});

/**
 * GET /api/user-tasks/:id
 *
 * Retrieves a user task identified by `id` for the authenticated user.
 *
 * Path Parameters:
 *   - id: number (task identifier)
 *
 * Responses:
 *   - 200: Returns the UserTaskDTO
 *   - 400: Invalid request input (invalid id format)
 *   - 401: Unauthorized (user not authenticated)
 *   - 404: Task not found or not owned by user
 *   - 500: Internal Server Error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  // Step 0: Cast Supabase client to Database-typed instance
  const supabase = locals.supabase as SupabaseClient<Database>;

  try {
    // Step 1: Validate and parse "id" path parameter
    const { id } = paramsSchema.parse(params);

    // Step 2: Authenticate user via Supabase auth
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

    // Step 3: Fetch user task using service layer
    const task = await getUserTaskById(supabase, id, user.id);

    // Step 4: Handle not found case
    if (!task) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Return task as JSON response
    return new Response(JSON.stringify(task), {
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
    logError("Error in GET /api/user-tasks/:id", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH /api/user-tasks/:id
 *
 * Updates a user task identified by `id` for the authenticated user.
 *
 * Path Parameters:
 *   - id: number (task identifier)
 *
 * Request Body:
 *   - status: string ('pending' | 'completed' | 'skipped' | 'active')
 *   - new_task_requests?: number (0-3)
 *
 * Responses:
 *   - 200: Returns the updated UserTaskDTO
 *   - 400: Invalid request input
 *   - 401: Unauthorized (user not authenticated)
 *   - 404: Task not found or not owned by user
 *   - 500: Internal Server Error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // Step 0: Cast Supabase client to Database-typed instance
  const supabase = locals.supabase as SupabaseClient<Database>;
  try {
    // Step 1: Validate and parse "id" path parameter
    const { id } = paramsSchema.parse(params);

    // Step 2: Parse and validate request body JSON
    const body = await request.json();
    const updateData = bodySchema.parse(body);

    // Step 3: Authenticate user via Supabase auth
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Step 4: Fetch existing user task and ensure ownership
    const fetchResult = await supabase
      .from("user_tasks")
      .select(
        "id, check_in_id, created_at, expires_at, metadata, new_task_requests, status, task_date, template_id, updated_at, user_id"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (fetchResult.error) {
      if (fetchResult.error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
      }
      logError("Error fetching user task", fetchResult.error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
    // Verify task exists before proceeding with update
    if (!fetchResult.data) {
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    }

    // Step 5: Prepare update payload
    const updatePayload = updateData;
    // Step 6: Perform update in database
    const updateResult = await supabase
      .from("user_tasks")
      .update(updatePayload)
      .select(
        "id, check_in_id, created_at, expires_at, metadata, new_task_requests, status, task_date, template_id, updated_at, user_id"
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (updateResult.error) {
      logError("Error updating user task", updateResult.error);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
    // Verify update succeeded
    if (!updateResult.data) {
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }

    // Step 7: Return updated task as JSON response
    return new Response(JSON.stringify(updateResult.data), { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return new Response(JSON.stringify({ error: err.errors }), { status: 400 });
    }
    logError("Error in PATCH /api/user-tasks/:id", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
  // This line ensures a Response is always returned and satisfies TypeScript
  throw new Error("Unexpected end of PATCH handler");
};
