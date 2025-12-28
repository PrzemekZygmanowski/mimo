import type { APIRoute } from "astro";
import { z } from "zod";
import type { Tables } from "../../../db/database.types";
import type { CheckInDTO, CreateCheckInCommand, UserTaskDTO } from "../../../types";

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
      return new Response(JSON.stringify({ error: "Nieautoryzowany" }), { status: 401 });
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
      return new Response(JSON.stringify({ error: "Błąd wewnętrzny serwera" }), { status: 500 });
    }

    // Step 4: Check if user already has a task for today
    const today = new Date().toISOString().split("T")[0];
    const { data: existingTask, error: existingTaskError } = await locals.supabase
      .from("user_tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_date", today)
      .maybeSingle();

    if (existingTaskError) {
      return new Response(
        JSON.stringify({ error: "Nie udało się sprawdzić istniejących zadań", details: existingTaskError.message }),
        { status: 500 }
      );
    }

    // Step 5: Query task_templates to find matching tasks (only if no task exists for today)
    // Tasks match if their required levels are null (suitable for all) OR equal to the user's levels
    let generatedTask: UserTaskDTO | undefined = undefined;

    if (!existingTask) {
      const { data: matchingTemplates, error: templatesError } = await locals.supabase
        .from("task_templates")
        .select("*")
        .or(`required_mood_level.is.null,required_mood_level.eq.${parsedBody.mood_level}`)
        .or(`required_energy_level.is.null,required_energy_level.eq.${parsedBody.energy_level}`);

      if (templatesError) {
        return new Response(
          JSON.stringify({ error: "Nie udało się pobrać szablonów zadań", details: templatesError.message }),
          { status: 500 }
        );
      }

      // Step 6: Select a random task from matching templates and create user_task
      if (matchingTemplates && matchingTemplates.length > 0) {
        // Select random template
        const randomIndex = Math.floor(Math.random() * matchingTemplates.length);
        const selectedTemplate = matchingTemplates[randomIndex] as Tables<"task_templates">;

        // Calculate expires_at (24 hours from now)
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Get today's date in YYYY-MM-DD format for task_date
        const taskDate = now.toISOString().split("T")[0];

        // Insert user_task
        const userTaskInsertData = {
          user_id: user.id,
          template_id: selectedTemplate.id,
          check_in_id: checkInInserted.id,
          task_date: taskDate,
          expires_at: expiresAt.toISOString(),
          status: "pending",
          new_task_requests: 0,
        };

        const { data: userTaskInserted, error: userTaskError } = await locals.supabase
          .from("user_tasks")
          .insert(userTaskInsertData)
          .select("*")
          .single();

        if (userTaskError) {
          return new Response(
            JSON.stringify({ error: "Nie udało się utworzyć zadania użytkownika", details: userTaskError.message }),
            {
              status: 500,
            }
          );
        }

        if (userTaskInserted) {
          generatedTask = {
            id: userTaskInserted.id,
            user_id: userTaskInserted.user_id,
            template_id: userTaskInserted.template_id,
            check_in_id: userTaskInserted.check_in_id,
            task_date: userTaskInserted.task_date,
            expires_at: userTaskInserted.expires_at,
            status: userTaskInserted.status,
            new_task_requests: userTaskInserted.new_task_requests,
            created_at: userTaskInserted.created_at,
            updated_at: userTaskInserted.updated_at,
            metadata: userTaskInserted.metadata,
          };

          // Step 7: Log TASK_ASSIGNED event
          await locals.supabase.from("user_events").insert({
            user_id: user.id,
            event_type: "TASK_ASSIGNED",
            entity_id: userTaskInserted.id,
            payload: {
              template_id: selectedTemplate.id,
              check_in_id: checkInInserted.id,
              mood_level: parsedBody.mood_level,
              energy_level: parsedBody.energy_level,
            },
          });
        }
      }
    }

    // Step 8: Log CHECKIN_CREATED event for audit trail
    await locals.supabase.from("user_events").insert({
      user_id: user.id,
      event_type: "CHECKIN_CREATED",
      entity_id: checkInInserted.id,
      payload: {
        mood_level: parsedBody.mood_level,
        energy_level: parsedBody.energy_level,
        has_notes: !!parsedBody.notes,
        task_generated: !!generatedTask,
      },
    });

    // Step 9: Build and return response with check-in and optional generated task
    const result: CheckInDTO = {
      id: checkInInserted.id,
      user_id: checkInInserted.user_id,
      mood_level: checkInInserted.mood_level,
      energy_level: checkInInserted.energy_level,
      at: checkInInserted.at,
      notes: checkInInserted.notes,
      generated_task: generatedTask,
    };
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Błąd wewnętrzny serwera";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 400 });
  }
};

// Please replace with actual integration tests using supabase test client
// TODO: add real tests for checking POST /api/checkins writes to database and auth
