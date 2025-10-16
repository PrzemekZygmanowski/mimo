import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import { logError } from "../../lib/logger";
import type { UserTaskDTO } from "../../types";

export const prerender = false;

// Schema for validating query parameters
const querySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  status: z.string().optional(),
  date: z.string().optional(),
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
    const result: UserTaskDTO[] = (tasks ?? []).map((row: any) => ({
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
