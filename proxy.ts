// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 👇 Define ALL routes that require login
const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',       // Protect Admin Panel
  '/teacher(.*)',     // Protect Teacher Portal
  '/check-role(.*)',  // Protect the "Traffic Cop" page
  '/api/enrollment(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // If the user tries to visit any of these pages, force them to login first
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|manifest.json|sw.js).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};