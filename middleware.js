import { NextResponse } from 'next/server';

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Public paths yang tidak perlu auth
    const publicPaths = ['/login', '/auth/callback', '/_next', '/favicon.ico'];

    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Cek token dari cookie
    const token = request.cookies.get('budget_token');

    if (!token) {
        // Redirect ke login PORTAL jika tidak ada token
        const portalLoginUrl = 'http://localhost:3000/login';
        return NextResponse.redirect(portalLoginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};