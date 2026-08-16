import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/login', '/register'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Redirect authenticated users away from auth pages
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublic && !token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico
     * - api/auth (NextAuth endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};
