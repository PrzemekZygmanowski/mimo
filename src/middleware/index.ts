import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

// Public paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Helper function to check if the current path is public
const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => pathname.startsWith(publicPath));
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Initialize Supabase client in locals
  context.locals.supabase = supabaseClient;

  // Try to fetch the authenticated user
  try {
    const {
      data: { user },
    } = await context.locals.supabase.auth.getUser();
    context.locals.user = user;
  } catch {
    // If there's an error fetching the user (e.g., no session), set user to null
    context.locals.user = null;
  }

  // Check if the path is public
  const isPublic = isPublicPath(pathname);

  // If the path is not public and user is not authenticated, redirect to login
  if (!isPublic && !context.locals.user) {
    return context.redirect("/login");
  }

  // If the user is authenticated and tries to access auth pages, redirect to home
  if (isPublic && context.locals.user) {
    return context.redirect("/");
  }

  return next();
});
