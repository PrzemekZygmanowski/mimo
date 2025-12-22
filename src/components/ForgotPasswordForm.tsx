import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { forgotPasswordSchema } from "../lib/validation/auth-schemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setSuccess(false);
    try {
      // TODO: Implementacja logiki resetowania hasła
      // Placeholder - będzie zaimplementowane w kolejnym etapie
      await Promise.resolve(data);
      setSubmittedEmail(data.email);
      setSuccess(true);
    } catch {
      setError("Wystąpił błąd podczas wysyłania linku. Spróbuj ponownie.");
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
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
            </div>
            <h2 className='text-2xl font-bold text-foreground'>Sprawdź swoją skrzynkę e-mail</h2>
            <p className='text-muted-foreground'>
              Link do resetowania hasła został wysłany na adres <strong>{submittedEmail}</strong>. Sprawdź swoją
              skrzynkę e-mail i kliknij w link, aby ustawić nowe hasło.
            </p>
            <div className='pt-4 space-y-2'>
              <p className='text-sm text-muted-foreground'>Nie otrzymałeś wiadomości?</p>
              <Button
                variant='outline'
                onClick={() => setSuccess(false)}
                className='w-full'
                aria-label='Wyślij link ponownie'>
                Wyślij ponownie
              </Button>
            </div>
            <div className='pt-2'>
              <a href='/login' className='text-primary hover:underline font-medium text-sm'>
                Wróć do logowania
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
          <h1 className='text-2xl font-bold text-foreground mb-2'>Przypomnij hasło</h1>
          <p className='text-sm text-muted-foreground'>Podaj adres e-mail, a wyślemy Ci link do resetowania hasła</p>
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

          {/* Submit button */}
          <div className='pt-2'>
            <Button type='submit' disabled={isSubmitting} className='w-full'>
              {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
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
