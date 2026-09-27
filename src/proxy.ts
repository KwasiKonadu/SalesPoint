import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Runs on every request except the ones excluded by `matcher` below (the
// login page itself, NextAuth's own endpoints, and static assets).
//
// - Page requests without a valid session are redirected to /login.
// - API requests without a valid session get a 401 instead of a redirect.
// - Authenticated requests get `x-user-id` / `x-user-role` set from the
//   verified JWT, overriding whatever a client sent — API routes trust
//   these headers instead of a client-supplied `x-user-id`.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api');

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const headers = new Headers(req.headers);
  headers.set('x-user-id', String(token.id));
  headers.set('x-user-role', String(token.role));

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
