import { z } from "zod";

export const emailSchema = z.string().min(1, "Podaj adres e-mail").email("Podaj poprawny adres e-mail");

export const passwordSchema = z.string().min(8, "Hasło musi mieć minimum 8 znaków");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Podaj hasło"),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });
