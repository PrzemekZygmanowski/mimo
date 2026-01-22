import { createSupabaseBrowserClient } from "@/db/supabase.client";
import type { CTAConfig, HomePageState, UserTaskDTO } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * @deprecated This hook is deprecated and should not be used.
 * Home page now uses Server-Side Rendering (SSR) for authentication state.
 * See index.astro for server-side data fetching implementation.
 *
 * ISSUE: This hook used createSupabaseBrowserClient() which cannot access
 * httpOnly session cookies, causing getUser() to always return null.
 * The solution was to move authentication checking to server-side.
 *
 * Custom hook for managing home page state
 * Handles authentication checking, fetching today's task, and determining appropriate CTA
 *
 * @returns {Object} Hook state and functions
 * @returns {HomePageState} state - Current page state
 * @returns {CTAConfig} ctaConfig - Configuration for the CTA button
 * @returns {Function} retry - Function to retry fetching data after error
 */
export const useHomePageState = () => {
  const [state, setState] = useState<HomePageState>({
    isLoading: true,
    isAuthenticated: false,
    hasTodayTask: false,
    error: null,
    todayTask: null,
  });

  // Create Supabase client once
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  /**
   * Fetches user authentication state and today's task
   * Updates component state based on the results
   */
  const fetchUserState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // User not logged in
        setState({
          isLoading: false,
          isAuthenticated: false,
          hasTodayTask: false,
          error: null,
          todayTask: null,
        });
        return;
      }
      console.log(1, supabase.auth.getUser());

      // User is logged in - check for today's task
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/user-tasks?date=${today}`, {
        method: "GET",
        credentials: "include", // Important for session cookies
      });

      // Handle expired token
      if (response.status === 401) {
        await supabase.auth.signOut();
        setState({
          isLoading: false,
          isAuthenticated: false,
          hasTodayTask: false,
          error: null,
          todayTask: null,
        });
        return;
      }

      // Handle server error
      if (response.status === 500) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "Wystąpił problem po stronie serwera. Spróbuj ponownie później.",
        }));
        return;
      }

      if (!response.ok) {
        throw new Error("Błąd podczas pobierania zadań");
      }

      const tasks: UserTaskDTO[] = await response.json();

      // Validate response format
      if (!Array.isArray(tasks)) {
        throw new Error("Invalid response format");
      }

      const todayTask = tasks.length > 0 ? tasks[0] : null;

      setState({
        isLoading: false,
        isAuthenticated: true,
        hasTodayTask: !!todayTask,
        error: null,
        todayTask,
      });
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.",
        }));
        return;
      }

      // Handle JSON parsing errors
      if (error instanceof SyntaxError) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "Otrzymano nieprawidłowe dane z serwera.",
        }));
        return;
      }

      // Generic error handler
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Nie udało się załadować danych. Spróbuj ponownie.",
      }));
    }
  }, [supabase]);

  /**
   * Determines the appropriate CTA configuration based on current state
   * Memoized to prevent unnecessary recalculations
   *
   * @returns {CTAConfig} Configuration for the CTA button
   */
  const ctaConfig = useMemo((): CTAConfig => {
    // User not authenticated
    if (!state.isAuthenticated) {
      return {
        text: "Zacznij",
        href: "/login",
        variant: "default",
      };
    }

    // User has completed today's check-in
    if (state.hasTodayTask) {
      return {
        text: "Zobacz Moje Zadanie",
        href: "/task",
        variant: "default",
      };
    }

    // User needs to complete check-in
    return {
      text: "Wykonaj Check-in",
      href: "/checkin",
      variant: "default",
    };
  }, [state.isAuthenticated, state.hasTodayTask]);

  // Initialize state on component mount
  useEffect(() => {
    fetchUserState();
  }, [fetchUserState]);

  return {
    state,
    ctaConfig,
    retry: fetchUserState,
  };
};
