import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {

    const { pathname } = request.nextUrl;

    // CORS for all API routes: allow everything from anywhere
    if (pathname.startsWith('/api')) {
        const response = request.method === 'OPTIONS'
            ? new NextResponse(null, { status: 200 })
            : NextResponse.next();

        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', '*');

        return response;
    }

    // Check for access_token cookie (only for non-API pages)
    const token = request.cookies.get('access_token')?.value;
    const isLoggedIn = !!token;

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
        // Apply middleware to all API routes and all other pages
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
