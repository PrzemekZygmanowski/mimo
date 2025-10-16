import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // Initialize Supabase client in locals
  context.locals.supabase = supabaseClient;
  // Fetch the authenticated user and store in locals.user
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();
  context.locals.user = user;
  return next();
});
