import { ErrorMessage } from "@/components/ErrorMessage";
import { HomePageContent } from "@/components/HomePageContent";
import type { CTAConfig, HomePageInitialState } from "@/types";
import { useMemo } from "react";

interface HomePageWrapperProps {
  // Initial state passed from server-side rendering
  initialState: HomePageInitialState;
}

/**
 * HomePageWrapper Component
 *
 * Main orchestration component for the home page
 * Receives server-side rendered state and determines appropriate CTA
 * This is the top-level React component mounted with client:load directive in index.astro
 *
 * Handles three main scenarios:
 * 1. User not logged in → Show "Zacznij" button → /login
 * 2. User logged in without today's check-in → Show "Wykonaj Check-in" button → /checkin
 * 3. User logged in with check-in completed → Show "Zobacz Moje Zadanie" button → /task
 */
export const HomePageWrapper = ({ initialState }: HomePageWrapperProps) => {
  /**
   * Determines the appropriate CTA configuration based on initial state
   * Memoized to prevent unnecessary recalculations
   */
  const ctaConfig = useMemo((): CTAConfig => {
    // User not authenticated
    if (!initialState.isAuthenticated) {
      return {
        text: "Zacznij",
        href: "/login",
        variant: "default",
      };
    }

    // User has completed today's check-in
    if (initialState.hasTodayTask) {
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
  }, [initialState.isAuthenticated, initialState.hasTodayTask]);

  // Error state - show error message with page reload option
  if (initialState.error) {
    return <ErrorMessage message={initialState.error} onRetry={() => window.location.reload()} />;
  }

  // Success state - show home page content with appropriate CTA
  return <HomePageContent ctaConfig={ctaConfig} />;
};
