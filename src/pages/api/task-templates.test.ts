import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabaseClient } from "../../db/supabase.client";
import { GET } from "./task-templates";
import type { Mock } from "vitest";


// Mock supabase client
vi.mock("../../db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(),
  },
}));

describe("GET /api/task-templates", () => {
  const mockTemplates = [
    {
      id: 1,
      title: "Task One",
      required_mood_level: 3,
      required_energy_level: 2,
      description: null,
      metadata: null,
      created_at: null,
      updated_at: null,
    },
  ];

  beforeEach(() => {
    // Default mock: successful response
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      then: (resolve: any) => Promise.resolve({ data: mockTemplates, error: null }).then(resolve),
    };
    (supabaseClient.from as Mock).mockReturnValue(builder);
  });

  it("returns 200 and transformed templates when no filters", async () => {
    const request = new Request("http://localhost/api/task-templates");
    const response = await GET({ request } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([
      {
        id: 1,
        name: "Task One",
        constraints: { mood_level: [3], energy_level: [2] },
      },
    ]);
  });

  it("returns 400 on invalid query parameters", async () => {
    const request = new Request("http://localhost/api/task-templates?mood_level=10");
    const response = await GET({ request } as any);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 500 when database error occurs", async () => {
    const errorMsg = "DB failure";
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      then: (resolve: any) => Promise.resolve({ data: null, error: { message: errorMsg } }).then(resolve),
    };
    (supabaseClient.from as Mock).mockReturnValueOnce(builder);

    const request = new Request("http://localhost/api/task-templates");
    const response = await GET({ request } as any);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: errorMsg });
  });
});
