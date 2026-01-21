/**
 * LoadingSkeleton Component
 *
 * Displays a loading state while fetching user data and checking check-in status
 * Provides visual indication of loading process for better UX
 * Uses pulsing animations to indicate active loading
 */
export const LoadingSkeleton = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] px-4'>
      <div className='max-w-2xl w-full space-y-8'>
        {/* Hero section skeleton */}
        <div className='text-center space-y-4'>
          {/* Title skeleton */}
          <div className='flex justify-center'>
            <div className='h-16 w-48 bg-muted rounded-lg animate-pulse' aria-hidden='true' />
          </div>

          {/* Description skeleton - 3 lines */}
          <div className='space-y-3 flex flex-col items-center'>
            <div className='h-4 w-full max-w-lg bg-muted rounded animate-pulse' aria-hidden='true' />
            <div className='h-4 w-full max-w-md bg-muted rounded animate-pulse' aria-hidden='true' />
            <div className='h-4 w-full max-w-sm bg-muted rounded animate-pulse' aria-hidden='true' />
          </div>
        </div>

        {/* CTA button skeleton */}
        <div className='flex justify-center'>
          <div className='h-12 w-64 bg-muted rounded-md animate-pulse' aria-hidden='true' />
        </div>
      </div>

      {/* Screen reader announcement */}
      <span className='sr-only' role='status' aria-live='polite'>
        Ładowanie danych...
      </span>
    </div>
  );
};
