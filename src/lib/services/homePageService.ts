import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { HomePageInitialState } from "../../types";
import { logError } from "../logger";
import { getUserTasks } from "./userTasksService";

/**
 * Fetches the initial state for the home page
 * Checks user authentication and retrieves today's task if user is authenticated
 *
 * @param supabase - Typed Supabase server client with access to session cookies
 * @returns Promise<HomePageInitialState> - Initial state object for home page
 */
export async function getHomePageInitialState(supabase: SupabaseClient<Database>): Promise<HomePageInitialState> {
  const initialState: HomePageInitialState = {
    isAuthenticated: false,
    hasTodayTask: false,
    todayTask: null,
    error: null,
  };

  try {
    // Check authentication using server-side supabase client
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // User not authenticated - return default state
      return initialState;
    }

    // User is authenticated
    initialState.isAuthenticated = true;

    try {
      // Fetch today's task
      const today = new Date().toISOString().split("T")[0];
      const tasks = await getUserTasks(supabase, user.id, { date: today });
      const todayTask = tasks.length > 0 ? tasks[0] : null;

      initialState.hasTodayTask = !!todayTask;
      initialState.todayTask = todayTask;
    } catch (taskError) {
      // Log error but don't fail the page - user can still see authenticated state
      logError("Error fetching today's task in getHomePageInitialState", taskError);
      initialState.error = "Nie udało się załadować dzisiejszego zadania";
    }

    return initialState;
  } catch (error) {
    // Critical error in authentication check
    logError("Error in server-side authentication in getHomePageInitialState", error);
    return {
      ...initialState,
      error: "Wystąpił problem podczas ładowania danych",
    };
  }
}
