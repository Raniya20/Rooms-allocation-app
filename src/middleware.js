// src/middleware.ts
import { NextResponse } from "next/server";
import { verifyAuth } from "./lib/auth";

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;
  // These are all the routes we want to protect
  const protectedRoutes = [
    "/api/allocate",
    "/api/allocations",
    "/api/notifications",
    "/api/rooms",
    "/api/users/get",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

    // If the route is not protected, then we should allow it.
  if (!isProtectedRoute) {
      console.log(`Middleware: Public route access: ${pathname}`);
        return NextResponse.next()
    }

  // Verify the token
    console.log(`Middleware: Protected route access attempt: ${pathname}`);
  const result = await verifyAuth(request);

  if (result.error) {
    console.log(`Middleware: Unauthorized access for route ${pathname}:`, result.error);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

// Check if user is an admin
  if (result.user && result.user.role !== "admin") {
      console.log(`Middleware: Forbidden access (not admin) for user ${result.user.email} on route ${pathname}`);
       return NextResponse.json({ message: "You're not authorized to perform this action" }, { status: 403 });
    }

    console.log(`Middleware: Access granted to admin user ${result.user.email} for route ${pathname}`);
   // If we have the token and the user is an admin we should proceed with the request.
  return NextResponse.next();
}

// Define which routes should be protected
export const config = {
  matcher: ["/api/:path*"],
};