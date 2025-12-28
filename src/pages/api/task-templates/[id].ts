import type { APIRoute } from "astro";
import { z } from "zod";
import { logError } from "../../../lib/logger";

export const prerender = false;

/**
 * Schema for validating path parameter "id"
 * Validates that id is a numeric string and converts it to a number
 */
const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID musi być poprawną liczbą")
    .transform(val => parseInt(val, 10)),
});

/**
 * GET /api/task-templates/:id
 * Retrieves detailed information about a specific task template by its ID.
 *
 * Path Parameters:
 * - id: Task template identifier (number)
 *
 * Response Format:
 * {
 *   id: number,
 *   name: string,
 *   description: string | null,
 *   constraints: {
 *     mood_level: number[],    // Always [1, 2, 3, 4, 5]
 *     energy_level: number[]   // Always [1, 2, 3]
 *   }
 * }
 *
 * Responses:
 * - 200 OK: Returns task template details
 * - 400 Bad Request: Invalid ID parameter
 * - 404 Not Found: Task template not found
 * - 500 Internal Server Error: Database or server errors
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate and parse "id" parameter
    const parseResult = paramsSchema.safeParse(params);

    if (!parseResult.success) {
      logError("Validation error in GET /api/task-templates/:id", parseResult.error);
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy parametr ID",
          details: parseResult.error.flatten(),
        }),
        { status: 400 }
      );
    }

    const { id } = parseResult.data;

    // Step 2: Fetch task template from database
    const { data: template, error: fetchError } = await locals.supabase
      .from("task_templates")
      .select("id, title, description, required_mood_level, required_energy_level, metadata, created_at, updated_at")
      .eq("id", id)
      .single();

    // Step 3: Handle database errors
    if (fetchError) {
      // PGRST116 is Supabase error code for "no rows returned"
      if (fetchError.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Szablon zadania nie został znaleziony" }), { status: 404 });
      }

      logError("Database error in GET /api/task-templates/:id", fetchError);
      return new Response(JSON.stringify({ error: "Błąd bazy danych" }), { status: 500 });
    }

    // Step 4: Transform data to response format
    // Map 'title' to 'name' and add fixed constraints
    const response = {
      id: template.id,
      name: template.title,
      description: template.description,
      constraints: {
        mood_level: [1, 2, 3, 4, 5],
        energy_level: [1, 2, 3],
      },
    };

    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error: unknown) {
    // Handle unexpected errors
    logError("Unexpected error in GET /api/task-templates/:id", error);
    const errorMessage = error instanceof Error ? error.message : "Wewnętrzny błąd serwera";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
