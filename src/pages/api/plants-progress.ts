import type { APIRoute } from "astro";
import { logError } from "../../lib/logger";
import type { PlantsProgressDTO, PlantsProgressResponseDTO, UpdatePlantsProgressRequestDTO } from "../../types";
// Add Zod import and schema
import { z, ZodError } from "zod";
import { updatePlantsProgress } from "../../lib/services/plantsProgressService";

const progressSchema = z.object({
  user_id: z.string(),
  board_state: z.any(),
  last_updated_at: z.string(),
});

// Schema for validating PATCH request body
const updateRequestSchema = z.object({
  board_state: z.array(z.array(z.any()).length(6)).length(5),
});

/**
 * GET /api/plants-progress
 *
 * Retrieves the current user's plant progress.
 *
 * @param locals.supabase - Supabase client with authenticated context
 * @returns 200 with PlantsProgressDTO on success,
 *          401 if unauthorized,
 *          404 if not found,
 *          500 on server error.
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Authenticate user via Supabase
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Fetch user's plant progress record from DB
    const { data: progressRow, error: fetchError } = await locals.supabase
      .from("user_plants_progress")
      .select("user_id, board_state, last_updated_at")
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      // Not found
      if (fetchError.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
      }
      // Other errors
      logError("Error fetching plants progress", fetchError);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }

    // Validate fetched row
    const { user_id, board_state, last_updated_at } = progressSchema.parse(progressRow);
    // Map to DTO
    const progress: PlantsProgressDTO = { user_id, board_state, last_updated_at };

    return new Response(JSON.stringify(progress), { status: 200 });
  } catch (err: unknown) {
    logError("Error in GET /api/plants-progress", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

/**
 * PATCH /api/plants-progress
 *
 * Updates the current user's plant progress board_state.
 *
 * @param request - Request containing JSON body with board_state: 5x6 array
 * @param locals.supabase - Supabase client with authenticated context
 * @returns 200 with PlantsProgressResponseDTO on success,
 *          400 if validation fails,
 *          401 if unauthorized,
 *          404 if record not found,
 *          500 on server error.
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Parse and validate request body
    const payload = await request.json();
    const { board_state } = updateRequestSchema.parse(payload) as UpdatePlantsProgressRequestDTO;

    // Update plant progress
    const result = await updatePlantsProgress(locals.supabase, user.id, board_state);
    const response: PlantsProgressResponseDTO = result;
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return new Response(JSON.stringify({ error: err.errors }), { status: 400 });
    }
    if (typeof (err as any).code === "string" && (err as any).code === "PGRST116") {
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    }
    logError("Error in PATCH /api/plants-progress", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
