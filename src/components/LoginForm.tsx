import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginSchema } from "../lib/validation/auth-schemas";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Wystąpił błąd podczas logowania. Spróbuj ponownie.");
        return;
      }

      // Success - full page reload to sync session with server
      window.location.replace("/");
    } catch {
      setError("Nie można połączyć się z serwerem. Spróbuj ponownie.");
    }
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-card rounded-xl shadow-lg border border-border p-8'>
        <div className='mb-6 text-center'>
          <h1 className='text-2xl font-bold text-foreground mb-2'>Logowanie</h1>
          <p className='text-sm text-muted-foreground'>Zaloguj się do swojego konta</p>
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
              autoComplete='current-password'
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

          {/* Forgot password link */}
          <div className='flex justify-end'>
            <a
              href='/forgot-password'
              className='text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded'>
              Zapomniałeś hasła?
            </a>
          </div>

          {/* Submit button */}
          <Button type='submit' disabled={isSubmitting} className='w-full'>
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </Button>
        </form>

        {/* Register link */}
        <div className='mt-6 text-center'>
          <p className='text-sm text-muted-foreground'>
            Nie masz konta?{" "}
            <a
              href='/register'
              className='text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded'>
              Zarejestruj się
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
