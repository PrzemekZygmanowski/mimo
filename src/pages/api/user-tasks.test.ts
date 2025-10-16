import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./user-tasks";

// Mock Supabase client
let mockSupabase: any;
beforeEach(() => {
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
