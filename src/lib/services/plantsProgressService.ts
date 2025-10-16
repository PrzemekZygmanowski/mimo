import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "../../db/database.types";
import type { PlantsProgressDTO } from "../../types";
import { logError } from "../logger";

export async function updatePlantsProgress(
  supabase: SupabaseClient,
  userId: string,
  boardState: Json
): Promise<PlantsProgressDTO> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("user_plants_progress")
      .update({ board_state: boardState, last_updated_at: now })
      .eq("user_id", userId)
      .select("user_id, board_state, last_updated_at")
      .single();
    if (error) {
      logError(`Error updating plants progress for user ${userId}`, error);
      throw error;
    }
    return {
      user_id: data.user_id,
      board_state: data.board_state,
      last_updated_at: data.last_updated_at,
    };
  } catch (err: unknown) {
    logError("Exception in updatePlantsProgress", err);
    throw err;
  }
}
