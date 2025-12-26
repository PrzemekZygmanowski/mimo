import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerSchema } from "../lib/validation/auth-schemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.");
        return;
      }

      // Success - show email confirmation message
      setSuccess(true);
    } catch {
      setError("Nie można połączyć się z serwerem. Spróbuj ponownie.");
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
            <h2 className='text-2xl font-bold text-foreground'>Sprawdź swoją skrzynkę e-mail</h2>
            <p className='text-muted-foreground'>
              Wysłaliśmy link aktywacyjny na podany adres e-mail. Kliknij w link, aby aktywować konto i się zalogować.
            </p>
            <div className='pt-4'>
              <a href='/login' className='text-primary hover:underline font-medium'>
                Przejdź do logowania
              </a>
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
          <h1 className='text-2xl font-bold text-foreground mb-2'>Rejestracja</h1>
          <p className='text-sm text-muted-foreground'>Utwórz nowe konto</p>
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

          {/* Email field */}
          <div className='space-y-2'>
            <Label htmlFor='email'>Adres e-mail</Label>
            <Input
              id='email'
              type='email'
              placeholder='twoj@email.com'
              autoComplete='email'
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p
                id='email-error'
                className='text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200'>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className='space-y-2'>
            <Label htmlFor='password'>Hasło</Label>
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
          </div>

          {/* Confirm Password field */}
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Powtórz hasło</Label>
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
              {isSubmitting ? "Rejestracja..." : "Zarejestruj się"}
            </Button>
          </div>
        </form>

        {/* Login link */}
        <div className='mt-6 text-center'>
          <p className='text-sm text-muted-foreground'>
            Masz już konto?{" "}
            <a
              href='/login'
              className='text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded'>
              Zaloguj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
