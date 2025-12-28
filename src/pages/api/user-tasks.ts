import type { SupabaseClient } from "@supabase/supabase-js";
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import type { Database } from "../../db/database.types";
import { logError } from "../../lib/logger";
import { createUserTask } from "../../lib/services/userTasksService";
import type { CreateUserTaskCommand, UserTaskDTO } from "../../types";

export const prerender = false;

// Schema for validating query parameters (GET)
const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  status: z.string().optional(),
  date: z.string().optional(),
});

// Schema for validating request body (POST)
const createUserTaskSchema = z.object({
  template_id: z.number().int().positive("template_id must be a positive integer"),
  user_id: z.string().uuid("user_id must be a valid UUID"),
  check_in_id: z.number().int().positive().nullable().optional(),
});

/**
 * GET /api/user-tasks
 * Retrieves a paginated list of tasks for the authenticated user.
 * Query parameters:
 *  - page: page number (default 1)
 *  - limit: items per page (default 10)
 *  - status: optional task status filter
 *  - date: optional task_date filter
 *
 * Returns 200 with an array of UserTaskDTO on success.
 * Returns 400 for invalid query parameters, 401 for unauthorized, 500 for server errors.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Validate query parameters
    const url = new URL(request.url);
    const rawQuery = Object.fromEntries(url.searchParams.entries());
    const { page, limit, status, date } = querySchema.parse(rawQuery);

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Step 3: Fetch user tasks from database with filters and pagination
    const pageNumber = page ?? 1;
    const pageSize = limit ?? 10;
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;
    // Build query
    let db = locals.supabase
      .from("user_tasks")
      .select(
        "id, check_in_id, created_at, expires_at, metadata, new_task_requests, status, task_date, template_id, updated_at, user_id"
      )
      .eq("user_id", user.id);
    if (status) db = db.eq("status", status);
    if (date) db = db.eq("task_date", date);
    const { data: tasks, error: dbError } = await db.range(from, to);
    if (dbError) {
      logError("Error fetching user tasks", dbError);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
    const result: UserTaskDTO[] = (tasks ?? []).map(row => ({
      id: row.id,
      check_in_id: row.check_in_id,
      created_at: row.created_at,
      expires_at: row.expires_at,
      metadata: row.metadata,
      new_task_requests: row.new_task_requests,
      status: row.status,
      task_date: row.task_date,
      template_id: row.template_id,
      updated_at: row.updated_at,
      user_id: row.user_id,
    }));
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err: unknown) {
    logError("Error in GET /api/user-tasks", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    const statusCode = err instanceof ZodError ? 400 : 500;
    return new Response(JSON.stringify({ error: message }), { status: statusCode });
  }
};

/**
 * POST /api/user-tasks
 * Creates a new user task by assigning a task template to a user.
 * Request Body:
 *  - template_id: number (required)
 *  - user_id: string (UUID, required)
 *  - check_in_id: number (optional)
 *
 * Returns 201 with the created UserTaskDTO on success.
 * Returns 400 for invalid input, 401 for unauthorized, 404 for missing resources, 500 for server errors.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Step 0: Cast Supabase client to Database-typed instance
  const supabase = locals.supabase as SupabaseClient<Database>;

  try {
    // Step 1: Parse and validate request body
    const body = await request.json();
    const validatedData = createUserTaskSchema.parse(body);

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Step 3: Verify user can create task (user_id must match authenticated user or have admin privileges)
    // For now, we enforce that user_id must match the authenticated user
    if (validatedData.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: Cannot create tasks for other users" }), { status: 403 });
    }

    // Step 4: Prepare task creation command with task_date set to today
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const command: CreateUserTaskCommand = {
      template_id: validatedData.template_id,
      user_id: validatedData.user_id,
      check_in_id: validatedData.check_in_id ?? null,
      task_date: today,
    };

    // Step 5: Create user task via service
    const createdTask = await createUserTask(supabase, command);

    // Step 6: Return created task with 201 status
    return new Response(JSON.stringify(createdTask), { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return new Response(JSON.stringify({ error: err.errors }), { status: 400 });
    }

    // Handle specific error cases from service layer
    if (err instanceof Error) {
      if (err.message.includes("not found") || err.message.includes("does not exist")) {
        return new Response(JSON.stringify({ error: err.message }), { status: 404 });
      }
      if (err.message.includes("already exists") || err.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
      }
    }

    logError("Error in POST /api/user-tasks", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
