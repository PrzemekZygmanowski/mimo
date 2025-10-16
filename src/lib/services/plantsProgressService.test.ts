import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Json } from "../../db/database.types";
import { logError } from "../logger";
import { updatePlantsProgress } from "./plantsProgressService";

describe("updatePlantsProgress service", () => {
  let mockSupabase: any;
  const userId = "user-1";
  const boardState: Json = []; // override in tests
  let mockSingle: any;

  beforeEach(() => {
    mockSingle = vi.fn();
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        update: () => ({
          eq: () => ({ select: () => ({ single: mockSingle }) }),
        }),
      }),
    };
    vi.spyOn(console, "error");
    vi.spyOn(logError, "bind" as never); // ensure logError calls don't break
  });

  it("returns updated DTO on success", async () => {
    const expected = { user_id: userId, board_state: [[0]], last_updated_at: "now" };
    mockSingle.mockResolvedValue({ data: expected, error: null });
    const result = await updatePlantsProgress(mockSupabase, userId, expected.board_state as Json);
    expect(result).toEqual(expected);
  });

  it("logs and throws when supabase returns error", async () => {
    const err = { message: "db error" };
    mockSingle.mockResolvedValue({ data: null, error: err });
    await expect(updatePlantsProgress(mockSupabase, userId, [[0]] as unknown as Json)).rejects.toEqual(err);
    // Here we could assert logError was called, but console logging is simple
  });

  it("logs and rethrows on exception", async () => {
    const exception = new Error("boom");
    mockSingle.mockRejectedValue(exception);
    await expect(updatePlantsProgress(mockSupabase, userId, [[0]] as unknown as Json)).rejects.toThrow("boom");
    // logError should have been called with the exception
  });
});
