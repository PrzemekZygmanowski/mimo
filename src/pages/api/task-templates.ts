// Create API endpoint for task-templates
import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseClient } from "../../db/supabase.client";
import { logError } from "../../lib/logger";
import type { TaskTemplateDTO } from "../../types";

export const prerender = false;

/**
 * Schema for validating optional mood_level (1-5) and energy_level (1-3) query parameters.
 */
const querySchema = z.object({
  mood_level: z.preprocess(
    (val) => (val !== undefined ? parseInt(String(val), 10) : undefined),
    z.number().min(1).max(5).optional()
  ),
  energy_level: z.preprocess(
    (val) => (val !== undefined ? parseInt(String(val), 10) : undefined),
    z.number().min(1).max(3).optional()
  ),
});

/**
 * GET /api/task-templates
 * Retrieves task templates from the database, applying optional mood_level and energy_level filters.
 *
 * Responses:
 * - 200: Array of templates in the format { id, name, constraints }
 * - 400: Validation error details
 * - 500: Database error message
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const parsedResult = querySchema.safeParse(params);
    if (!parsedResult.success) {
      logError("Validation error in GET /api/task-templates", parsedResult.error);
      return new Response(JSON.stringify({ error: parsedResult.error.flatten() }), { status: 400 });
    }
    const parsed = parsedResult.data;

    // Database query and data transformation
    const builder = supabaseClient.from("task_templates").select("*");
    if (parsed.mood_level !== undefined) {
      builder.eq("required_mood_level", parsed.mood_level);
    }
    if (parsed.energy_level !== undefined) {
      builder.eq("required_energy_level", parsed.energy_level);
    }
    const { data: templates, error } = await builder;
    if (error) {
      logError("Database error in GET /api/task-templates", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    const result = (templates as TaskTemplateDTO[]).map((t) => ({
      id: t.id,
      name: t.title,
      constraints: {
        mood_level: t.required_mood_level != null ? [t.required_mood_level] : [1, 2, 3, 4, 5],
        energy_level: t.required_energy_level != null ? [t.required_energy_level] : [1, 2, 3],
      },
    }));
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
};
