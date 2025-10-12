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

export const GET: APIRoute = async ({ params }) => {
  try {
    // Validate and parse "id" parameter
    const { id } = paramsSchema.parse(params);

    // Step 1: Mock fetching generated task for the check-in
    // Mock task template for mapping
    const mockTemplate = {
      id: 1,
      title: "Mock Task Template",
      description: "This is a mock template for demonstration",
      metadata: null,
      required_energy_level: 2,
      required_mood_level: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const mockTask: UserTaskDTO = {
      id: 1,
      check_in_id: id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      metadata: { templateTitle: mockTemplate.title, templateDescription: mockTemplate.description },
      new_task_requests: 0,
      status: "pending",
      task_date: new Date().toISOString().split("T")[0],
      template_id: 1,
      updated_at: new Date().toISOString(),
      user_id: "user-1",
    };

    // Return mocked CheckInDTO
    const mockCheckIn: CheckInDTO = {
      id,
      user_id: "user-1",
      mood_level: 3,
      energy_level: 2,
      at: new Date().toISOString(),
      notes: "Mock check-in",
      metadata: null,
      generated_task: mockTask,
    };

    return new Response(JSON.stringify(mockCheckIn), { status: 200 });
  } catch (err: unknown) {
    logError("Error in GET /api/checkins/:id", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
