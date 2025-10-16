import { beforeEach, describe, expect, it, vi } from "vitest";
import * as service from "../../lib/services/plantsProgressService";
import { PATCH } from "./plants-progress.ts";

const validBoardState = Array.from({ length: 5 }, () => Array.from({ length: 6 }, () => 0));
const mockResponse = {
  user_id: "user-1",
  board_state: validBoardState,
  last_updated_at: "2025-10-16T12:00:00Z",
};

let mockSupabase: any;
let mockRequest: any;
let locals: any;

beforeEach(() => {
  mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
  };
  locals = { supabase: mockSupabase };
  mockRequest = {
    json: vi.fn(),
  };
  vi.spyOn(service, "updatePlantsProgress");
});

describe("PATCH /api/plants-progress", () => {
  it("returns 200 and updated progress for valid request", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockRequest.json.mockResolvedValue({ board_state: validBoardState });
    service.updatePlantsProgress.mockResolvedValue(mockResponse);

    const response = await PATCH({ request: mockRequest, locals } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(mockResponse);
    expect(service.updatePlantsProgress).toHaveBeenCalledWith(mockSupabase, "user-1", validBoardState);
  });

  it("returns 401 when unauthorized", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    const response = await PATCH({ request: mockRequest, locals } as any);
    expect(response.status).toBe(401);
  });

  it("returns 400 when board_state is invalid shape", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockRequest.json.mockResolvedValue({
      board_state: [
        [1, 2],
        [3, 4],
      ],
    });

    const response = await PATCH({ request: mockRequest, locals } as any);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeInstanceOf(Array);
  });

  it("returns 404 when no record to update", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockRequest.json.mockResolvedValue({ board_state: validBoardState });
    const err: any = new Error("Not Found");
    err.code = "PGRST116";
    service.updatePlantsProgress.mockRejectedValue(err);

    const response = await PATCH({ request: mockRequest, locals } as any);
    expect(response.status).toBe(404);
  });

  it("returns 500 on service exception", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mockRequest.json.mockResolvedValue({ board_state: validBoardState });
    service.updatePlantsProgress.mockRejectedValue(new Error("boom"));

    const response = await PATCH({ request: mockRequest, locals } as any);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("boom");
  });
});
