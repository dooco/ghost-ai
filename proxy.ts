import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const signInPath =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim() || "/sign-in";
const signUpPath =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL?.trim() || "/sign-up";

const isPublicRoute = createRouteMatcher([
  signInPath + "(.*)",
  signUpPath + "(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return;
  }
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
