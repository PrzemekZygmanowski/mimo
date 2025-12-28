import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./index";

// Mock data for tests
const mockUser = { id: "user-123" };

const mockCheckInData = {
  id: 1,
  user_id: "user-123",
  mood_level: 3,
  energy_level: 2,
  at: "2025-12-28T12:00:00Z",
  notes: "Feeling okay",
  metadata: null,
};

const mockTaskTemplate = {
  id: 10,
  title: "Take a short walk",
  description: "Walk for 5 minutes",
  required_mood_level: null,
  required_energy_level: null,
  metadata: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: null,
};

const mockUserTask = {
  id: 50,
  user_id: "user-123",
  template_id: 10,
  check_in_id: 1,
  task_date: "2025-12-28",
  expires_at: "2025-12-29T12:00:00Z",
  status: "pending",
  new_task_requests: 0,
  created_at: "2025-12-28T12:00:00Z",
  updated_at: null,
  metadata: null,
};

let mockSupabase: any;

beforeEach(() => {
  // Mock Supabase client with all necessary methods
  mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn(),
  };
});

describe("POST /api/checkins", () => {
  it("returns 201 with check-in and generated task when all conditions are met", async () => {
    // Setup mock for successful check-in creation
    const checkInBuilder: any = {
      insert: () => checkInBuilder,
      select: () => checkInBuilder,
      single: () => Promise.resolve({ data: mockCheckInData, error: null }),
    };

    // Setup mock for checking existing tasks (none found)
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };

    // Setup mock for task templates query
    const templatesBuilder: any = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };
    // Make the builder itself a thenable (Promise-like)
    templatesBuilder.then = vi.fn((resolve) => {
      resolve({ data: [mockTaskTemplate], error: null });
      return Promise.resolve({ data: [mockTaskTemplate], error: null });
    });

    // Setup mock for user_tasks insert
    const userTaskBuilder: any = {
      insert: () => userTaskBuilder,
      select: () => userTaskBuilder,
      single: () => Promise.resolve({ data: mockUserTask, error: null }),
    };

    // Setup mock for user_events insert (for both TASK_ASSIGNED and CHECKIN_CREATED)
    const userEventsBuilder: any = {
      insert: () => Promise.resolve({ data: {}, error: null }),
    };

    mockSupabase.from = vi
      .fn()
      .mockReturnValueOnce(checkInBuilder) // check_ins insert
      .mockReturnValueOnce(existingTaskBuilder) // user_tasks check
      .mockReturnValueOnce(templatesBuilder) // task_templates query
      .mockReturnValueOnce(userTaskBuilder) // user_tasks insert
      .mockReturnValueOnce(userEventsBuilder) // user_events TASK_ASSIGNED
      .mockReturnValueOnce(userEventsBuilder); // user_events CHECKIN_CREATED

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 3,
        energy_level: 2,
        notes: "Feeling okay",
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body).toMatchObject({
      id: mockCheckInData.id,
      user_id: mockCheckInData.user_id,
      mood_level: 3,
      energy_level: 2,
      notes: "Feeling okay",
    });
    expect(body.generated_task).toBeDefined();
    expect(body.generated_task.id).toBe(mockUserTask.id);
  });

  it("returns 201 with check-in but no generated task when user already has task for today", async () => {
    // Setup mock for successful check-in creation
    const checkInBuilder: any = {
      insert: () => checkInBuilder,
      select: () => checkInBuilder,
      single: () => Promise.resolve({ data: mockCheckInData, error: null }),
    };

    // Setup mock for checking existing tasks (found one)
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: { id: 99 }, error: null }),
    };

    // Setup mock for user_events insert (only CHECKIN_CREATED)
    const userEventsBuilder: any = {
      insert: () => Promise.resolve({ data: {}, error: null }),
    };

    mockSupabase.from = vi
      .fn()
      .mockReturnValueOnce(checkInBuilder) // check_ins insert
      .mockReturnValueOnce(existingTaskBuilder) // user_tasks check
      .mockReturnValueOnce(userEventsBuilder); // user_events CHECKIN_CREATED

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 3,
        energy_level: 2,
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.generated_task).toBeUndefined();
  });

  it("returns 201 with check-in but no generated task when no matching templates found", async () => {
    // Setup mock for successful check-in creation
    const checkInBuilder: any = {
      insert: () => checkInBuilder,
      select: () => checkInBuilder,
      single: () => Promise.resolve({ data: mockCheckInData, error: null }),
    };

    // Setup mock for checking existing tasks (none found)
    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };

    // Setup mock for task templates query (no templates)
    const templatesBuilder: any = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };
    templatesBuilder.then = vi.fn((resolve) => {
      resolve({ data: [], error: null });
      return Promise.resolve({ data: [], error: null });
    });

    // Setup mock for user_events insert
    const userEventsBuilder: any = {
      insert: () => Promise.resolve({ data: {}, error: null }),
    };

    mockSupabase.from = vi
      .fn()
      .mockReturnValueOnce(checkInBuilder) // check_ins insert
      .mockReturnValueOnce(existingTaskBuilder) // user_tasks check
      .mockReturnValueOnce(templatesBuilder) // task_templates query
      .mockReturnValueOnce(userEventsBuilder); // user_events CHECKIN_CREATED

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 5,
        energy_level: 1,
        notes: "No matching tasks",
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.generated_task).toBeUndefined();
  });

  it("returns 400 when mood_level is out of range", async () => {
    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 6, // Invalid: should be 1-5
        energy_level: 2,
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(400);
  });

  it("returns 400 when energy_level is out of range", async () => {
    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 3,
        energy_level: 4, // Invalid: should be 1-3
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(400);
  });

  it("returns 401 when user is not authenticated", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 3,
        energy_level: 2,
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(401);
  });

  it("returns 500 when check-in insert fails", async () => {
    const checkInBuilder: any = {
      insert: () => checkInBuilder,
      select: () => checkInBuilder,
      single: () => Promise.resolve({ data: null, error: { message: "Database error" } }),
    };

    mockSupabase.from = vi.fn().mockReturnValueOnce(checkInBuilder);

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 3,
        energy_level: 2,
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(500);
  });

  it("returns 500 when task templates query fails", async () => {
    const checkInBuilder: any = {
      insert: () => checkInBuilder,
      select: () => checkInBuilder,
      single: () => Promise.resolve({ data: mockCheckInData, error: null }),
    };

    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };

    const templatesBuilder: any = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
    };
    templatesBuilder.then = vi.fn((resolve) => {
      resolve({ data: null, error: { message: "Database error" } });
      return Promise.resolve({ data: null, error: { message: "Database error" } });
    });

    mockSupabase.from = vi
      .fn()
      .mockReturnValueOnce(checkInBuilder)
      .mockReturnValueOnce(existingTaskBuilder)
      .mockReturnValueOnce(templatesBuilder);

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 3,
        energy_level: 2,
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(500);
  });

  it("handles optional notes field correctly", async () => {
    const checkInBuilder: any = {
      insert: () => checkInBuilder,
      select: () => checkInBuilder,
      single: () => Promise.resolve({ data: { ...mockCheckInData, notes: null }, error: null }),
    };

    const existingTaskBuilder: any = {
      select: () => existingTaskBuilder,
      eq: () => existingTaskBuilder,
      maybeSingle: () => Promise.resolve({ data: { id: 99 }, error: null }),
    };

    const userEventsBuilder: any = {
      insert: () => Promise.resolve({ data: {}, error: null }),
    };

    mockSupabase.from = vi
      .fn()
      .mockReturnValueOnce(checkInBuilder)
      .mockReturnValueOnce(existingTaskBuilder)
      .mockReturnValueOnce(userEventsBuilder);

    const request = new Request("http://localhost/api/checkins", {
      method: "POST",
      body: JSON.stringify({
        mood_level: 3,
        energy_level: 2,
        // notes is optional, not provided
      }),
    });

    const response = await POST({ request, locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.notes).toBeNull();
  });
});

