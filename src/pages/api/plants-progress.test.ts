import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./plants-progress.ts";

const mockProgress = {
  user_id: "user-1",
  board_state: { some: "state" },
  last_updated_at: "2025-10-12T16:00:00Z",
};

let mockSupabase: any;

beforeEach(() => {
  mockSupabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
    from: vi.fn().mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: mockProgress, error: null }),
        }),
      }),
    })),
  };
});

describe("GET /api/plants-progress", () => {
  it("returns 200 and progress for valid user", async () => {
    const response = await GET({ locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockProgress);
  });

  it("returns 401 when unauthorized", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    const response = await GET({ locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(401);
  });

  it("returns 404 when no record found", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
        }),
      }),
    });
    const response = await GET({ locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(404);
  });

  it("returns 500 on fetch error", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockSupabase.from = vi.fn().mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { code: "OTHER_ERR" } }),
        }),
      }),
    });
    const response = await GET({ locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(500);
  });

  it("returns 500 on exception", async () => {
    mockSupabase.auth.getUser.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const response = await GET({ locals: { supabase: mockSupabase } } as any);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("boom");
  });
});
