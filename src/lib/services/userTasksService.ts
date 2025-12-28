import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateUserTaskCommand, UserTaskDTO } from "../../types";
import { logError } from "../logger";

/**
 * Creates a new user task in the database.
 * This function handles the business logic for task creation including:
 * - Verifying the template exists
 * - Calculating expiration time (24 hours from creation)
 * - Ensuring uniqueness constraint (user_id, task_date)
 *
 * @param supabase - Typed Supabase client
 * @param command - Command object with task creation details
 * @returns Promise<UserTaskDTO> - The created task
 * @throws Error if validation fails or database operation fails
 */
export async function createUserTask(
  supabase: SupabaseClient<Database>,
  command: CreateUserTaskCommand
): Promise<UserTaskDTO> {
  try {
    // Step 1: Verify that the task template exists
    const { data: template, error: templateError } = await supabase
      .from("task_templates")
      .select("id, title")
      .eq("id", command.template_id)
      .single();

    if (templateError || !template) {
      const errorMsg = `Task template with id ${command.template_id} not found`;
      logError(errorMsg, templateError);
      throw new Error(errorMsg);
    }

    // Step 2: If check_in_id is provided, verify it exists and belongs to the user
    if (command.check_in_id) {
      const { data: checkIn, error: checkInError } = await supabase
        .from("check_ins")
        .select("id, user_id")
        .eq("id", command.check_in_id)
        .eq("user_id", command.user_id)
        .single();

      if (checkInError || !checkIn) {
        const errorMsg = `Check-in with id ${command.check_in_id} not found for user ${command.user_id}`;
        logError(errorMsg, checkInError);
        throw new Error(errorMsg);
      }
    }

    // Step 3: Check if a task already exists for this user on this date
    // Due to unique constraint on (user_id, task_date), we should check first
    const { data: existingTask, error: existingError } = await supabase
      .from("user_tasks")
      .select("id, task_date")
      .eq("user_id", command.user_id)
      .eq("task_date", command.task_date)
      .maybeSingle();

    // Handle potential errors (but not "no rows" which is expected)
    if (existingError) {
      logError("Error checking for existing task", existingError);
      throw new Error("Error checking for existing task");
    }

    if (existingTask) {
      throw new Error(`A task already exists for user ${command.user_id} on date ${command.task_date}`);
    }

    // Step 4: Calculate expires_at (24 hours from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Step 5: Prepare insert payload
    const insertPayload: Database["public"]["Tables"]["user_tasks"]["Insert"] = {
      user_id: command.user_id,
      template_id: command.template_id,
      check_in_id: command.check_in_id ?? null,
      task_date: command.task_date,
      expires_at: expiresAt.toISOString(),
      status: "pending",
      new_task_requests: 0,
    };

    // Step 6: Insert the task into the database
    const { data: createdTask, error: insertError } = await supabase
      .from("user_tasks")
      .insert(insertPayload)
      .select(
        "id, check_in_id, created_at, expires_at, metadata, new_task_requests, status, task_date, template_id, updated_at, user_id"
      )
      .single();

    if (insertError || !createdTask) {
      logError("Error creating user task", insertError);
      // Check for unique constraint violation
      if (insertError?.code === "23505") {
        throw new Error(`A task already exists for user ${command.user_id} on date ${command.task_date}`);
      }
      throw new Error("Failed to create user task");
    }

    // Step 7: Map database row to DTO
    const result: UserTaskDTO = {
      id: createdTask.id,
      user_id: createdTask.user_id,
      template_id: createdTask.template_id,
      check_in_id: createdTask.check_in_id,
      task_date: createdTask.task_date,
      expires_at: createdTask.expires_at,
      status: createdTask.status,
      new_task_requests: createdTask.new_task_requests,
      metadata: createdTask.metadata,
      created_at: createdTask.created_at,
      updated_at: createdTask.updated_at,
    };

    return result;
  } catch (err: unknown) {
    logError("Exception in createUserTask", err);
    throw err;
  }
}
