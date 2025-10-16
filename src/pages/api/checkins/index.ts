import type { APIRoute } from "astro";
import { z } from "zod";
import type { CheckInDTO, CreateCheckInCommand } from "../../../types";

export const prerender = false;

// Schema for validating check-in request payload
const createCheckInSchema = z.object({
  mood_level: z.number().min(1).max(5),
  energy_level: z.number().min(1).max(3),
  notes: z.string().optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Step 2: Walidacja danych wejściowych przy użyciu zod
    const body: unknown = await request.json();
    const parsedBody: CreateCheckInCommand = createCheckInSchema.parse(body);

    // Step 3: Insert check-in record into database
    const insertData = {
      user_id: user.id,
      mood_level: parsedBody.mood_level,
      energy_level: parsedBody.energy_level,
      notes: parsedBody.notes ?? null,
      at: new Date().toISOString(),
    };
    const { data: checkInInserted, error: checkInError } = await locals.supabase
      .from("check_ins")
      .insert(insertData)
      .select("*")
      .single();
    if (checkInError || !checkInInserted) {
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }

    const result: CheckInDTO = {
      id: checkInInserted.id,
      user_id: checkInInserted.user_id,
      mood_level: checkInInserted.mood_level,
      energy_level: checkInInserted.energy_level,
      at: checkInInserted.at,
      notes: checkInInserted.notes,
    };
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
};

// Please replace with actual integration tests using supabase test client
// TODO: add real tests for checking POST /api/checkins writes to database and auth
