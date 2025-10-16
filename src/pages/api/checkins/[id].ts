import type { APIRoute } from "astro";
import { z } from "zod";
import { logError } from "../../../lib/logger";
import type { CheckInDTO, UserTaskDTO } from "../../../types";

// Schema for validating path parameter "id" and converting it to a number
const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/)
    .transform((val) => parseInt(val, 10)),
});

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate and parse "id" parameter
    const { id } = paramsSchema.parse(params);

    // Step 1: Mock fetching generated task for the check-in
    // Authenticate user via Supabase
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Fetch check-in record from DB
    const { data: checkInRow, error: fetchError } = await locals.supabase
      .from("check_ins")
      .select("id, user_id, mood_level, energy_level, at, notes, metadata")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
      }
      logError("Error fetching check-in record", fetchError);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }

    // Map to DTO
    const checkIn: CheckInDTO = {
      id: checkInRow.id,
      user_id: checkInRow.user_id,
      mood_level: checkInRow.mood_level,
      energy_level: checkInRow.energy_level,
      at: checkInRow.at,
      notes: checkInRow.notes,
      metadata: checkInRow.metadata,
    };
    // Step 2: Fetch generated task for this check-in, if any
    const { data: generatedTaskRow, error: taskError } = await locals.supabase
      .from("user_tasks")
      .select(
        "id, check_in_id, created_at, expires_at, metadata, new_task_requests, status, task_date, template_id, updated_at, user_id"
      )
      .eq("check_in_id", id)
      .eq("user_id", user.id)
      .single();
    if (taskError && taskError.code !== "PGRST116") {
      logError("Error fetching generated task", taskError);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
    if (generatedTaskRow) {
      checkIn.generated_task = generatedTaskRow as UserTaskDTO;
    }
    return new Response(JSON.stringify(checkIn), { status: 200 });
  } catch (err: unknown) {
    logError("Error in GET /api/checkins/:id", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
