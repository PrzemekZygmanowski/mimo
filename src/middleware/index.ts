import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/", // Home page accessible for both authenticated and unauthenticated users
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/confirm", // Email confirmation page
  "/api/auth/login", // Login endpoint
  "/api/auth/register", // Register endpoint
];

// Paths that should be accessible for authenticated users only
const AUTH_ONLY_PATHS = [
  "/api/auth/logout", // Logout endpoint
];

// Protected paths that require authentication but are not redirected when authenticated
const PROTECTED_PATHS = [
  "/checkin",
  "/task",
  "/api/user-tasks",
  "/api/plants-progress",
  "/api/checkins",
  "/api/task-templates",
];

// Helper function to check if the current path is public
const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATHS.some(publicPath => {
    // Exact match for root path to avoid matching all paths
    if (publicPath === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(publicPath);
  });
};

// Helper function to check if the current path requires authentication
const isAuthOnlyPath = (pathname: string): boolean => {
  return AUTH_ONLY_PATHS.some(authPath => pathname.startsWith(authPath));
};

// Helper function to check if the current path is protected
const isProtectedPath = (pathname: string): boolean => {
  return PROTECTED_PATHS.some(protectedPath => pathname.startsWith(protectedPath));
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
  const isProtected = isProtectedPath(pathname);

  // Auth-only paths: require authentication
  if (isAuthOnly && !context.locals.user) {
    return context.redirect("/login");
  }

  // Protected paths: require authentication
  if (isProtected && !context.locals.user) {
    return context.redirect("/login");
  }

  // Public paths: redirect authenticated users away from auth pages (except home)
  // Home page (/) is accessible for both authenticated and unauthenticated users
  if (isPublic && context.locals.user && pathname !== "/") {
    return context.redirect("/");
  }

  // All other non-public, non-auth-only, non-protected paths: require authentication
  if (!isPublic && !isAuthOnly && !isProtected && !context.locals.user) {
    return context.redirect("/login");
  }

  return next();
});
