import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { resetPasswordSchema } from "../lib/validation/auth-schemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  code: string;
}

export function ResetPasswordForm({ code }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setSuccess(false);
    try {
      // TODO: Implementacja logiki resetowania hasła z kodem
      // Placeholder - będzie zaimplementowane w kolejnym etapie
      await Promise.resolve({ code, password: data.password });
      setSuccess(true);
    } catch {
      setError("Wystąpił błąd podczas resetowania hasła. Link może być nieprawidłowy lub wygasły.");
    }
  };

  if (success) {
    return (
      <div className='w-full max-w-md mx-auto'>
        <div className='bg-card rounded-xl shadow-lg border border-border p-8'>
          <div className='text-center space-y-4'>
            <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto'>
              <svg
                className='w-8 h-8 text-primary'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-foreground'>Hasło zostało zmienione</h2>
            <p className='text-muted-foreground'>
              Twoje hasło zostało pomyślnie zmienione. Możesz teraz zalogować się do swojego konta używając nowego
              hasła.
            </p>
            <div className='pt-4'>
              <Button asChild className='w-full'>
                <a href='/login'>Przejdź do logowania</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-card rounded-xl shadow-lg border border-border p-8'>
        <div className='mb-6 text-center'>
          <h1 className='text-2xl font-bold text-foreground mb-2'>Ustaw nowe hasło</h1>
          <p className='text-sm text-muted-foreground'>Wprowadź nowe hasło do swojego konta</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Global error message */}
          {error && (
            <div
              className='p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-1 duration-200'
              role='alert'>
              {error}
            </div>
          )}

          {/* Password field */}
          <div className='space-y-2'>
            <Label htmlFor='password'>Nowe hasło</Label>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              autoComplete='new-password'
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p
                id='password-error'
                className='text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200'>
                {errors.password.message}
              </p>
            )}
            <p className='text-xs text-muted-foreground'>Hasło musi mieć minimum 8 znaków</p>
          </div>

          {/* Confirm Password field */}
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Powtórz nowe hasło</Label>
            <Input
              id='confirmPassword'
              type='password'
              placeholder='••••••••'
              autoComplete='new-password'
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p
                id='confirm-password-error'
                className='text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200'>
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit button */}
          <div className='pt-2'>
            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? "Ustawianie hasła..." : "Ustaw nowe hasło"}
            </Button>
          </div>
        </form>

        {/* Back to login link */}
        <div className='mt-6 text-center'>
          <a
            href='/login'
            className='text-sm text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded'>
            ← Wróć do logowania
          </a>
        </div>
      </div>
    </div>
  );
}
