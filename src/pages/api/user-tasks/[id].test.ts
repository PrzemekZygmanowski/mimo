import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./[id]";

let mockSupabase: any;
beforeEach(() => {
  mockSupabase = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    from: vi.fn(),
  };
});

describe("PATCH /api/user-tasks/:id", () => {
  it("returns 401 when unauthorized", async () => {
    mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: {} });
    const response = await PATCH({
      params: { id: "1" },
      request: new Request("", { body: JSON.stringify({ status: "pending" }), method: "PATCH" }),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(401);
  });

  it("returns 400 on invalid request body", async () => {
    const response = await PATCH({
      params: { id: "1" },
      request: new Request("", { body: JSON.stringify({ status: "invalid" }), method: "PATCH" }),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(400);
  });

  it("returns 404 if task not found", async () => {
    // authorized
    const fetchBuilder: any = {
      select: () => fetchBuilder,
      eq: () => fetchBuilder,
      single: () => Promise.resolve({ data: null, error: { code: "PGRST116" } }),
    };
    mockSupabase.from.mockReturnValue(fetchBuilder);
    const response = await PATCH({
      params: { id: "1" },
      request: new Request("", { body: JSON.stringify({ status: "pending" }), method: "PATCH" }),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(404);
  });

  it("returns 200 and updated task on success", async () => {
    // authorized
    const existing = {
      id: 1,
      check_in_id: null,
      created_at: null,
      expires_at: "2025-10-10",
      metadata: null,
      new_task_requests: 0,
      status: "pending",
      task_date: "2025-10-10",
      template_id: 2,
      updated_at: null,
      user_id: "user-1",
    };
    const updated = { ...existing, status: "completed" };
    const fetchBuilder: any = {
      select: () => fetchBuilder,
      eq: () => fetchBuilder,
      single: () => Promise.resolve({ data: existing, error: null }),
    };
    const updateBuilder: any = {
      update: () => updateBuilder,
      select: () => updateBuilder,
      eq: () => updateBuilder,
      single: () => Promise.resolve({ data: updated, error: null }),
    };
    mockSupabase.from.mockReturnValueOnce(fetchBuilder).mockReturnValueOnce(updateBuilder);
    const response = await PATCH({
      params: { id: "1" },
      request: new Request("", { body: JSON.stringify({ status: "completed" }), method: "PATCH" }),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(updated);
  });
});
