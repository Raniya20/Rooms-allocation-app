// src/middleware.ts
import { NextResponse } from "next/server";

export async function middleware(request) {
    const pathname = request.nextUrl.pathname;
    // These are all the routes we want to protect
    const protectedRoutes = [
        "/api/allocate",
        "/api/allocations",
        "/api/notifications",
        "/api/rooms"
    ];

    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // If the route is not protected, then we should allow it.
    if (!isProtectedRoute) {
        console.log(`Middleware: Public route access: ${pathname}`);
        return NextResponse.next()
    }


    console.log(`Middleware: Protected route access attempt: ${pathname}`);

    // Continue with the request for all protected routes since the token verification will be handled by the handlers.
    return NextResponse.next();
}


// Define which routes should be protected
export const config = {
    matcher: ["/api/:path*"],
};