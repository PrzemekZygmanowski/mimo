import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateUserTaskCommand } from "../../types";
import { createUserTask } from "./userTasksService";

describe("createUserTask service", () => {
  let mockSupabase: any;
  const userId = "user-123";
  const templateId = 1;
  const checkInId = 5;
  const taskDate = "2025-10-12";

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    };
  });

  it("creates a user task successfully with all required fields", async () => {
    const command: CreateUserTaskCommand = {
      template_id: templateId,
      user_id: userId,
      task_date: taskDate,
    };

    // Mock template exists
    const templateBuilder: any = {
      select: () => templateBuilder,
      eq: () => templateBuilder,
      single: () =>
        Promise.resolve({
          data: { id: templateId, title: "Test Task" },
          error: null,
        }),
    };

    // Mock check for existing task (none found)
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };

    // Mock successful insert
    const insertedTask = {
      id: 10,
      user_id: userId,
      template_id: templateId,
      check_in_id: null,
      task_date: taskDate,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      new_task_requests: 0,
      metadata: null,
      created_at: "2025-10-12T12:00:00Z",
      updated_at: null,
    };

    const insertBuilder: any = {
      insert: () => insertBuilder,
      select: () => insertBuilder,
      single: () => Promise.resolve({ data: insertedTask, error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(templateBuilder) // template check
      .mockReturnValueOnce(existingTaskBuilder) // existing task check
      .mockReturnValueOnce(insertBuilder); // insert

    const result = await createUserTask(mockSupabase, command);

    expect(result).toBeDefined();
    expect(result.id).toBe(10);
    expect(result.user_id).toBe(userId);
    expect(result.template_id).toBe(templateId);
    expect(result.status).toBe("pending");
    expect(result.new_task_requests).toBe(0);
  });

  it("creates a user task with check_in_id when provided", async () => {
    const command: CreateUserTaskCommand = {
      template_id: templateId,
      user_id: userId,
      check_in_id: checkInId,
      task_date: taskDate,
    };

    // Mock template exists
    const templateBuilder: any = {
      select: () => templateBuilder,
      eq: () => templateBuilder,
      single: () =>
        Promise.resolve({
          data: { id: templateId, title: "Test Task" },
          error: null,
        }),
    };

    // Mock check-in exists
    const checkInBuilder: any = {
      select: () => checkInBuilder,
      eq: () => checkInBuilder,
      single: () =>
        Promise.resolve({
          data: { id: checkInId, user_id: userId },
          error: null,
        }),
    };

    // Mock check for existing task (none found)
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };

    // Mock successful insert
    const insertedTask = {
      id: 10,
      user_id: userId,
      template_id: templateId,
      check_in_id: checkInId,
      task_date: taskDate,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
      new_task_requests: 0,
      metadata: null,
      created_at: "2025-10-12T12:00:00Z",
      updated_at: null,
    };

    const insertBuilder: any = {
      insert: () => insertBuilder,
      select: () => insertBuilder,
      single: () => Promise.resolve({ data: insertedTask, error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(templateBuilder) // template check
      .mockReturnValueOnce(checkInBuilder) // check-in check
      .mockReturnValueOnce(existingTaskBuilder) // existing task check
      .mockReturnValueOnce(insertBuilder); // insert

    const result = await createUserTask(mockSupabase, command);

    expect(result).toBeDefined();
    expect(result.check_in_id).toBe(checkInId);
  });

  it("throws error when template does not exist", async () => {
    const command: CreateUserTaskCommand = {
      template_id: 999,
      user_id: userId,
      task_date: taskDate,
    };

    // Mock template not found
    const templateBuilder: any = {
      select: () => templateBuilder,
      eq: () => templateBuilder,
      single: () =>
        Promise.resolve({
          data: null,
          error: { code: "PGRST116" },
        }),
    };

    mockSupabase.from.mockReturnValueOnce(templateBuilder);

    await expect(createUserTask(mockSupabase, command)).rejects.toThrow(
      "Task template with id 999 not found"
    );
  });

  it("throws error when check_in_id is provided but check-in does not exist", async () => {
    const command: CreateUserTaskCommand = {
      template_id: templateId,
      user_id: userId,
      check_in_id: 999,
      task_date: taskDate,
    };

    // Mock template exists
    const templateBuilder: any = {
      select: () => templateBuilder,
      eq: () => templateBuilder,
      single: () =>
        Promise.resolve({
          data: { id: templateId, title: "Test Task" },
          error: null,
        }),
    };

    // Mock check-in not found
    const checkInBuilder: any = {
      select: () => checkInBuilder,
      eq: () => checkInBuilder,
      single: () =>
        Promise.resolve({
          data: null,
          error: { code: "PGRST116" },
        }),
    };

    mockSupabase.from.mockReturnValueOnce(templateBuilder).mockReturnValueOnce(checkInBuilder);

    await expect(createUserTask(mockSupabase, command)).rejects.toThrow(
      "Check-in with id 999 not found for user user-123"
    );
  });

  it("throws error when task already exists for user on the same date", async () => {
    const command: CreateUserTaskCommand = {
      template_id: templateId,
      user_id: userId,
      task_date: taskDate,
    };

    // Mock template exists
    const templateBuilder: any = {
      select: () => templateBuilder,
      eq: () => templateBuilder,
      single: () =>
        Promise.resolve({
          data: { id: templateId, title: "Test Task" },
          error: null,
        }),
    };

    // Mock existing task found
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () =>
        Promise.resolve({
          data: { id: 5, task_date: taskDate },
          error: null,
        }),
    };

    mockSupabase.from.mockReturnValueOnce(templateBuilder).mockReturnValueOnce(existingTaskBuilder);

    await expect(createUserTask(mockSupabase, command)).rejects.toThrow(
      `A task already exists for user ${userId} on date ${taskDate}`
    );
  });

  it("throws error when database insert fails", async () => {
    const command: CreateUserTaskCommand = {
      template_id: templateId,
      user_id: userId,
      task_date: taskDate,
    };

    // Mock template exists
    const templateBuilder: any = {
      select: () => templateBuilder,
      eq: () => templateBuilder,
      single: () =>
        Promise.resolve({
          data: { id: templateId, title: "Test Task" },
          error: null,
        }),
    };

    // Mock check for existing task (none found)
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };

    // Mock failed insert
    const insertBuilder: any = {
      insert: () => insertBuilder,
      select: () => insertBuilder,
      single: () =>
        Promise.resolve({
          data: null,
          error: { message: "Database error" },
        }),
    };

    mockSupabase.from
      .mockReturnValueOnce(templateBuilder)
      .mockReturnValueOnce(existingTaskBuilder)
      .mockReturnValueOnce(insertBuilder);

    await expect(createUserTask(mockSupabase, command)).rejects.toThrow("Failed to create user task");
  });

  it("handles unique constraint violation error (23505)", async () => {
    const command: CreateUserTaskCommand = {
      template_id: templateId,
      user_id: userId,
      task_date: taskDate,
    };

    // Mock template exists
    const templateBuilder: any = {
      select: () => templateBuilder,
      eq: () => templateBuilder,
      single: () =>
        Promise.resolve({
          data: { id: templateId, title: "Test Task" },
          error: null,
        }),
    };

    // Mock check for existing task (none found initially)
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };

    // Mock unique constraint violation
    const insertBuilder: any = {
      insert: () => insertBuilder,
      select: () => insertBuilder,
      single: () =>
        Promise.resolve({
          data: null,
          error: { code: "23505", message: "duplicate key value violates unique constraint" },
        }),
    };

    mockSupabase.from
      .mockReturnValueOnce(templateBuilder)
      .mockReturnValueOnce(existingTaskBuilder)
      .mockReturnValueOnce(insertBuilder);

    await expect(createUserTask(mockSupabase, command)).rejects.toThrow(
      `A task already exists for user ${userId} on date ${taskDate}`
    );
  });
});

