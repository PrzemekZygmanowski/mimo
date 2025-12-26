import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login", // Login endpoint
  "/api/auth/register", // Register endpoint
];

// Paths that should be accessible for authenticated users only
const AUTH_ONLY_PATHS = [
  "/api/auth/logout", // Logout endpoint
];

// Helper function to check if the current path is public
const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => pathname.startsWith(publicPath));
};

// Helper function to check if the current path requires authentication
const isAuthOnlyPath = (pathname: string): boolean => {
  return AUTH_ONLY_PATHS.some(authPath => pathname.startsWith(authPath));
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Initialize Supabase server instance with cookie management
  const supabase = createSupabaseServerInstance({
    headers: context.request.headers,
    cookies: context.cookies,
  });

  context.locals.supabase = supabase;

  // IMPORTANT: Always get user session first before any other operations
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user;
  } catch {
    // If there's an error fetching the user (e.g., no session), set user to null
    context.locals.user = null;
  }

  // Check path type
  const isPublic = isPublicPath(pathname);
  const isAuthOnly = isAuthOnlyPath(pathname);

  // Auth-only paths: require authentication
  if (isAuthOnly && !context.locals.user) {
    return context.redirect("/login");
  }

  // Public paths: redirect authenticated users away from auth pages
  if (isPublic && context.locals.user) {
    return context.redirect("/");
  }

  // Protected paths: require authentication
  if (!isPublic && !isAuthOnly && !context.locals.user) {
    return context.redirect("/login");
  }

  return next();
});
