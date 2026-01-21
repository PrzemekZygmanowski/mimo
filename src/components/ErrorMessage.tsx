import { Button } from "@/components/ui/button";
import type { ErrorMessageProps } from "@/types";

/**
 * ErrorMessage Component
 *
 * Displays a friendly error message with retry functionality
 * Used when API calls fail or network errors occur
 *
 * @param {ErrorMessageProps} props - Component props
 * @param {string} props.message - Error message to display
 * @param {Function} props.onRetry - Callback function when retry button is clicked
 */
export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => {
  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] px-4' role='alert' aria-live='assertive'>
      <div className='max-w-md w-full bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center'>
        {/* Error icon */}
        <div className='mb-4 flex justify-center'>
          <svg
            className='h-12 w-12 text-destructive'
            fill='none'
            strokeWidth='2'
            stroke='currentColor'
            viewBox='0 0 24 24'
            aria-hidden='true'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z'
            />
          </svg>
        </div>

        {/* Error message */}
        <h2 className='text-lg font-semibold text-foreground mb-2'>Ups! Coś poszło nie tak</h2>
        <p className='text-sm text-muted-foreground mb-6'>{message}</p>

        {/* Retry button */}
        <Button
          onClick={onRetry}
          variant='default'
          className='w-full sm:w-auto'
          aria-label='Spróbuj ponownie załadować dane'>
          Spróbuj ponownie
        </Button>
      </div>
    </div>
  );
};
