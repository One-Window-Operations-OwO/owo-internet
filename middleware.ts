import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {

    // Check for access_token cookie
    const token = request.cookies.get('access_token')?.value;
    const isLoggedIn = !!token;

    const { pathname } = request.nextUrl;
    // const adminRoutes = ['/verifikasi-admin-only-example']; // Example
    const protectedRoutes = ['/dashboard', '/owo', '/verifikasi'];
    const authRoutes = ['/login'];

    // Redirect to dashboard if logged in and trying to access login page
    if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Redirect to login if not logged in and trying to access protected routes
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}


export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
