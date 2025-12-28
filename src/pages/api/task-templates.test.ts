/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { supabaseClient } from "../../db/supabase.client";
import { GET, POST } from "./task-templates";

// Mock logger
vi.mock("../../lib/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

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
    expect(body).toEqual({ error: "Błąd bazy danych" });
  });
});

describe("POST /api/task-templates", () => {
  const mockUser = { id: "user-123" };
  const mockCreatedTemplate = {
    id: 1,
    title: "Nowy szablon",
    description: "Opis testowy",
    required_mood_level: 3,
    required_energy_level: 2,
    metadata: null,
    created_at: "2025-12-28T10:00:00Z",
    updated_at: "2025-12-28T10:00:00Z",
  };

  const createMockLocals = (authSuccess = true, user = mockUser) => ({
    supabase: {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue(
            authSuccess ? { data: { user }, error: null } : { data: { user: null }, error: new Error("Auth error") }
          ),
      },
      from: vi.fn(),
    },
  });

  it("returns 201 and created template for single template", async () => {
    const requestBody = {
      title: "Nowy szablon",
      description: "Opis testowy",
      required_mood_level: 3,
      required_energy_level: 2,
    };

    const builder: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [mockCreatedTemplate],
        error: null,
      }),
    };

    const locals = createMockLocals();
    (locals.supabase.from as Mock).mockReturnValue(builder);

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body).toEqual(mockCreatedTemplate);
    expect(builder.insert).toHaveBeenCalledWith([
      {
        title: "Nowy szablon",
        description: "Opis testowy",
        required_mood_level: 3,
        required_energy_level: 2,
        metadata: null,
      },
    ]);
  });

  it("returns 201 and created templates array for batch request", async () => {
    const requestBody = [
      { title: "Szablon 1", required_mood_level: 2 },
      { title: "Szablon 2", required_energy_level: 1 },
    ];

    const mockCreatedTemplates = [
      { ...mockCreatedTemplate, id: 1, title: "Szablon 1", required_mood_level: 2 },
      { ...mockCreatedTemplate, id: 2, title: "Szablon 2", required_energy_level: 1 },
    ];

    const builder: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: mockCreatedTemplates,
        error: null,
      }),
    };

    const locals = createMockLocals();
    (locals.supabase.from as Mock).mockReturnValue(builder);

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe("Szablon 1");
    expect(body[1].title).toBe("Szablon 2");
  });

  it("returns 401 when user is not authenticated", async () => {
    const locals = createMockLocals(false);

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body).toEqual({ error: "Brak autoryzacji" });
  });

  it("returns 400 when title is missing", async () => {
    const locals = createMockLocals();

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ description: "Brak tytułu" }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toBe("Walidacja nie powiodła się");
    expect(body).toHaveProperty("details");
  });

  it("returns 400 when title is empty string", async () => {
    const locals = createMockLocals();

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ title: "" }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Walidacja nie powiodła się");
  });

  it("returns 400 when mood_level is out of range", async () => {
    const locals = createMockLocals();

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ title: "Test", required_mood_level: 10 }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Walidacja nie powiodła się");
  });

  it("returns 400 when energy_level is out of range", async () => {
    const locals = createMockLocals();

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ title: "Test", required_energy_level: 5 }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Walidacja nie powiodła się");
  });

  it("returns 400 when array is empty", async () => {
    const locals = createMockLocals();

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify([]),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Walidacja nie powiodła się");
  });

  it("returns 500 when database insert fails", async () => {
    const builder: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB error" },
      }),
    };

    const locals = createMockLocals();
    (locals.supabase.from as Mock).mockReturnValue(builder);

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({ error: "Nie udało się utworzyć szablonu(ów) zadania" });
  });

  it("handles optional fields correctly (null values)", async () => {
    const requestBody = {
      title: "Minimalny szablon",
    };

    const minimalTemplate = {
      ...mockCreatedTemplate,
      title: "Minimalny szablon",
      description: null,
      required_mood_level: null,
      required_energy_level: null,
    };

    const builder: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [minimalTemplate],
        error: null,
      }),
    };

    const locals = createMockLocals();
    (locals.supabase.from as Mock).mockReturnValue(builder);

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.title).toBe("Minimalny szablon");
    expect(body.description).toBeNull();
    expect(body.required_mood_level).toBeNull();
    expect(body.required_energy_level).toBeNull();
  });

  it("returns 400 when title exceeds 255 characters", async () => {
    const locals = createMockLocals();
    const longTitle = "a".repeat(256);

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ title: longTitle }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Walidacja nie powiodła się");
  });

  it("returns 400 when description exceeds 1000 characters", async () => {
    const locals = createMockLocals();
    const longDescription = "a".repeat(1001);

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify({ title: "Test", description: longDescription }),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Walidacja nie powiodła się");
  });

  it("returns 400 when batch exceeds 100 templates", async () => {
    const locals = createMockLocals();
    const largeBatch = Array(101)
      .fill(null)
      .map((_, i) => ({ title: `Template ${i}` }));

    const request = new Request("http://localhost/api/task-templates", {
      method: "POST",
      body: JSON.stringify(largeBatch),
    });

    const response = await POST({ request, locals } as any);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe("Walidacja nie powiodła się");
  });
});
