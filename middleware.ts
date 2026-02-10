import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    
    const userRole = request.cookies.get('user_role')?.value;
    const isLoggedIn = !!userRole;
    
    const { pathname } = request.nextUrl;
    const adminRoutes = ['/verifikasi-admin-only-example', '/verifikasi']; 
    const protectedRoutes = ['/dashboard', '/owo'];
    const authRoutes = ['/login'];
    if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (isLoggedIn) {
            
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }
    
    if (protectedRoutes.some((route) => pathname.startsWith(route)) || adminRoutes.some((route) => pathname.startsWith(route))) {
        
        if (!isLoggedIn) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('user_role');
            return response;
        }

        const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
        if (isAdminRoute && userRole !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
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
