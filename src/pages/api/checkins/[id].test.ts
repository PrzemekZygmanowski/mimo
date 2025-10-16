// Replace existing tests with comprehensive unit tests for GET /api/checkins/:id
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./[id].ts";

// Sample data for tests
const mockCheckIn = {
  id: 1,
  user_id: "user-1",
  mood_level: 3,
  energy_level: 2,
  at: "2025-10-12T12:05:00Z",
  notes: null,
  metadata: null,
};
const mockGeneratedTask = {
  id: 1,
  check_in_id: 1,
  created_at: "2025-10-12T12:00:00Z",
  expires_at: "2025-10-13T12:00:00Z",
  metadata: null,
  new_task_requests: 0,
  status: "pending",
  task_date: "2025-10-12",
  template_id: 1,
  updated_at: "2025-10-12T12:00:00Z",
  user_id: "user-1",
};

let mockSupabase: any;

beforeEach(() => {
  // Mock Supabase client
  mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: vi
      .fn()
      // First call: fetching check-in
      .mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockCheckIn, error: null }),
            }),
          }),
        }),
      }))
      // Second call: fetching generated task
      .mockImplementationOnce(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: mockGeneratedTask, error: null }),
            }),
          }),
        }),
      })),
  };
});

describe("GET /api/checkins/:id", () => {
  it("returns 200 and check-in with generated_task for valid id", async () => {
    const response = await GET({ params: { id: "1" }, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ...mockCheckIn, generated_task: mockGeneratedTask });
  });

  it("returns 404 when check-in not found", async () => {
    // Mock no check-in found with status 406
    mockSupabase.from = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { status: 406 } }) }) }),
      }),
    });
    const response = await GET({ params: { id: "2" }, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthorized", async () => {
    // Mock unauthorized
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: {} });
    const response = await GET({ params: { id: "1" }, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(401);
  });
});
