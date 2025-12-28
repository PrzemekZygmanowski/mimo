import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./user-tasks";

// Mock the userTasksService module
vi.mock("../../lib/services/userTasksService", () => ({
  createUserTask: vi.fn(),
}));

import { createUserTask } from "../../lib/services/userTasksService";

// Mock Supabase client
let mockSupabase: any;
beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: vi.fn(),
  };
});

describe("GET /api/user-tasks", () => {
  it("returns 200 and empty array when no tasks", async () => {
    // Setup mock for no tasks
    const tasks: any[] = [];
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      range: () => Promise.resolve({ data: tasks, error: null }),
    };
    mockSupabase.from.mockReturnValue(builder);
    const response = await GET({
      request: new Request("http://localhost/api/user-tasks"),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([]);
  });

  it("returns 200 and filtered tasks when status and date filters applied", async () => {
    // Setup mock tasks
    const tasks = [
      {
        id: 1,
        user_id: "user-1",
        check_in_id: null,
        created_at: "2025-10-12T00:00:00Z",
        expires_at: "2025-10-13T00:00:00Z",
        metadata: null,
        new_task_requests: 0,
        status: "pending",
        task_date: "2025-10-12",
        template_id: 2,
        updated_at: null,
      },
    ];
    const builder: any = {
      select: () => builder,
      eq: (_col: string, _val: any) => builder,
      range: (_from: number, _to: number) => Promise.resolve({ data: tasks, error: null }),
    };
    mockSupabase.from.mockReturnValue(builder);
    const response = await GET({
      request: new Request("http://localhost/api/user-tasks?page=2&limit=5&status=pending&date=2025-10-12"),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(tasks);
  });

  it("returns 400 on invalid query parameters", async () => {
    const response = await GET({
      request: new Request("http://localhost/api/user-tasks?page=0&limit=-1"),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 401 when unauthorized", async () => {
    // Mock unauthorized
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: {} });
    const response = await GET({
      request: new Request("http://localhost/api/user-tasks"),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(401);
  });
});

describe("POST /api/user-tasks", () => {
  const validBody = {
    template_id: 1,
    user_id: "user-1",
    check_in_id: null,
  };

  it("returns 201 and created task on success", async () => {
    const createdTask = {
      id: 10,
      user_id: "user-1",
      template_id: 1,
      check_in_id: null,
      task_date: "2025-10-12",
      expires_at: "2025-10-13T12:00:00Z",
      status: "pending",
      new_task_requests: 0,
      metadata: null,
      created_at: "2025-10-12T12:00:00Z",
      updated_at: null,
    };

    (createUserTask as any).mockResolvedValue(createdTask);

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual(createdTask);
  });

  it("returns 201 when check_in_id is provided", async () => {
    const bodyWithCheckIn = {
      template_id: 1,
      user_id: "user-1",
      check_in_id: 5,
    };

    const createdTask = {
      id: 10,
      user_id: "user-1",
      template_id: 1,
      check_in_id: 5,
      task_date: "2025-10-12",
      expires_at: "2025-10-13T12:00:00Z",
      status: "pending",
      new_task_requests: 0,
      metadata: null,
      created_at: "2025-10-12T12:00:00Z",
      updated_at: null,
    };

    (createUserTask as any).mockResolvedValue(createdTask);

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(bodyWithCheckIn),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.check_in_id).toBe(5);
  });

  it("returns 400 for invalid request body - missing template_id", async () => {
    const invalidBody = {
      user_id: "user-1",
    };

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(invalidBody),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 for invalid request body - invalid user_id format", async () => {
    const invalidBody = {
      template_id: 1,
      user_id: "not-a-uuid",
    };

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(invalidBody),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 for invalid request body - negative template_id", async () => {
    const invalidBody = {
      template_id: -1,
      user_id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(invalidBody),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 401 when unauthorized", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: {} });

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 403 when user tries to create task for another user", async () => {
    const bodyForOtherUser = {
      template_id: 1,
      user_id: "user-2", // different from authenticated user (user-1)
    };

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(bodyForOtherUser),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("Cannot create tasks for other users");
  });

  it("returns 404 when template does not exist", async () => {
    (createUserTask as any).mockRejectedValue(new Error("Task template with id 999 not found"));

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify({ ...validBody, template_id: 999 }),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("not found");
  });

  it("returns 400 when task already exists for user on the same date", async () => {
    (createUserTask as any).mockRejectedValue(new Error("A task already exists for user user-1 on date 2025-10-12"));

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("already exists");
  });

  it("returns 500 for unexpected server errors", async () => {
    (createUserTask as any).mockRejectedValue(new Error("Unexpected database error"));

    const response = await POST({
      request: new Request("http://localhost/api/user-tasks", {
        method: "POST",
        body: JSON.stringify(validBody),
      }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
