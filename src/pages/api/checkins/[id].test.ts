import { describe, expect, it } from "vitest";
import { GET } from "./[id].ts";

// Mock context type for invoking APIRoute
interface MockContext {
  params: Record<string, string>;
}

describe("GET /api/checkins/:id", () => {
  it("should return 200 and mock check-in with generated_task for valid id", async () => {
    const context = { params: { id: "1" } } as unknown as MockContext;
    const response = await GET(context as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("id", 1);
    expect(body).toHaveProperty("user_id");
    expect(body).toHaveProperty("generated_task");
    expect(body.generated_task).toHaveProperty("id", 1);
  });

  it("should return 500 for invalid id format", async () => {
    const context = { params: { id: "abc" } } as unknown as MockContext;
    const response = await GET(context as any);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toHaveProperty("error");
  });
});
