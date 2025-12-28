// Create API endpoint for task-templates
import type { APIRoute } from "astro";
import { z } from "zod";
import { supabaseClient } from "../../db/supabase.client";
import { logError, logInfo } from "../../lib/logger";
import type { TaskTemplateDTO } from "../../types";

export const prerender = false;

/**
 * Schema for validating optional mood_level (1-5) and energy_level (1-3) query parameters.
 */
const querySchema = z.object({
  mood_level: z.preprocess(
    val => (val !== undefined ? parseInt(String(val), 10) : undefined),
    z.number().min(1).max(5).optional()
  ),
  energy_level: z.preprocess(
    val => (val !== undefined ? parseInt(String(val), 10) : undefined),
    z.number().min(1).max(3).optional()
  ),
});

/**
 * Schema for validating a single task template creation payload
 * Validates the CreateTaskTemplateCommand structure
 */
const createTaskTemplateSchema = z.object({
  title: z
    .string()
    .min(1, "Tytuł jest wymagany i nie może być pusty")
    .max(255, "Tytuł nie może przekraczać 255 znaków"),
  description: z.string().max(1000, "Opis nie może przekraczać 1000 znaków").nullable().optional(),
  required_mood_level: z.number().int().min(1).max(5).nullable().optional(),
  required_energy_level: z.number().int().min(1).max(3).nullable().optional(),
  metadata: z.any().nullable().optional(), // JSON type, can be any valid JSON
});

/**
 * Schema for validating POST /api/task-templates request body
 * Accepts either a single task template object or an array of task templates
 * Maximum 100 templates per batch request to prevent server overload
 */
const createTaskTemplateRequestSchema = z.union([
  createTaskTemplateSchema,
  z
    .array(createTaskTemplateSchema)
    .min(1, "Tablica musi zawierać co najmniej jeden szablon zadania")
    .max(100, "Maksymalna liczba szablonów w jednym żądaniu to 100"),
]);

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
      return new Response(JSON.stringify({ error: "Błąd bazy danych" }), { status: 500 });
    }
    const result = (templates as TaskTemplateDTO[]).map(t => ({
      id: t.id,
      name: t.title,
      constraints: {
        mood_level: t.required_mood_level != null ? [t.required_mood_level] : [1, 2, 3, 4, 5],
        energy_level: t.required_energy_level != null ? [t.required_energy_level] : [1, 2, 3],
      },
    }));
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Nieprawidłowe żądanie";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
};

/**
 * POST /api/task-templates
 * Creates one or more task templates in the database.
 *
 * Request Body (Single):
 * {
 *   "title": "Task Title",
 *   "description": "Optional description",
 *   "required_mood_level": 3,
 *   "required_energy_level": 2,
 *   "metadata": {}
 * }
 *
 * Request Body (Batch):
 * [
 *   { "title": "Task 1", ... },
 *   { "title": "Task 2", ... }
 * ]
 *
 * Responses:
 * - 201 Created: Returns the created TaskTemplateDTO or array of TaskTemplateDTOs
 * - 400 Bad Request: Validation errors
 * - 401 Unauthorized: User not authenticated
 * - 500 Internal Server Error: Database errors
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      logError("Authentication failed in POST /api/task-templates", authError);
      return new Response(JSON.stringify({ error: "Brak autoryzacji" }), { status: 401 });
    }

    // Step 2: Parse and validate request body (single object or array)
    const body: unknown = await request.json();
    const parsedBody = createTaskTemplateRequestSchema.parse(body);

    // Determine if we're processing a single item or batch
    const isArray = Array.isArray(parsedBody);
    const templates = isArray ? parsedBody : [parsedBody];

    // Log batch operation info
    if (isArray) {
      logInfo(`Creating ${templates.length} task templates in batch for user ${user.id}`);
    }

    // Step 3: Prepare data for insertion
    const insertData = templates.map(template => ({
      title: template.title,
      description: template.description ?? null,
      required_mood_level: template.required_mood_level ?? null,
      required_energy_level: template.required_energy_level ?? null,
      metadata: template.metadata ?? null,
    }));

    // Step 4: Insert task template(s) into database
    const { data: createdTemplates, error: insertError } = await locals.supabase
      .from("task_templates")
      .insert(insertData)
      .select("*");

    if (insertError || !createdTemplates || createdTemplates.length === 0) {
      logError("Database error in POST /api/task-templates", insertError);
      return new Response(JSON.stringify({ error: "Nie udało się utworzyć szablonu(ów) zadania" }), { status: 500 });
    }

    // Step 5: Map database results to TaskTemplateDTO
    const results: TaskTemplateDTO[] = createdTemplates.map(template => ({
      id: template.id,
      created_at: template.created_at,
      title: template.title,
      description: template.description,
      required_mood_level: template.required_mood_level,
      required_energy_level: template.required_energy_level,
      metadata: template.metadata,
      updated_at: template.updated_at,
    }));

    // Return single object or array based on input
    const responseBody = isArray ? results : results[0];
    return new Response(JSON.stringify(responseBody), { status: 201 });
  } catch (error: unknown) {
    // Handle validation errors and other exceptions
    if (error instanceof z.ZodError) {
      logError("Validation error in POST /api/task-templates", error.flatten());
      return new Response(JSON.stringify({ error: "Walidacja nie powiodła się", details: error.flatten() }), {
        status: 400,
      });
    }

    const errorMessage = error instanceof Error ? error.message : "Wewnętrzny błąd serwera";
    logError("Unexpected error in POST /api/task-templates", error);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
};
