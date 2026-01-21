import { ErrorMessage } from "@/components/ErrorMessage";
import { HomePageContent } from "@/components/HomePageContent";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useHomePageState } from "@/hooks/useHomePageState";

/**
 * HomePageWrapper Component
 *
 * Main orchestration component for the home page
 * Manages state, executes API calls, and renders appropriate content based on user state
 * This is the top-level React component mounted with client:load directive in index.astro
 *
 * Handles three main scenarios:
 * 1. User not logged in → Show "Zacznij" button → /login
 * 2. User logged in without today's check-in → Show "Wykonaj Check-in" button → /checkin
 * 3. User logged in with check-in completed → Show "Zobacz Moje Zadanie" button → /task
 */
export const HomePageWrapper = () => {
  const { state, ctaConfig, retry } = useHomePageState();

  // Loading state - show skeleton
  if (state.isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state - show error message with retry option
  if (state.error) {
    return <ErrorMessage message={state.error} onRetry={retry} />;
  }

  // Success state - show home page content with appropriate CTA
  return <HomePageContent ctaConfig={ctaConfig} />;
};
