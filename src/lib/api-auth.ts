import { NextRequest, NextResponse } from 'next/server'

/**
 * `x-user-id` / `x-user-role` are set by middleware.ts from a verified
 * session JWT — never trust these coming from anywhere else.
 */
export function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-user-id')
}

export function getUserRole(req: NextRequest): string | null {
  return req.headers.get('x-user-role')
}

/** Returns a 403 response if the caller isn't an admin, otherwise null. */
export function requireAdmin(req: NextRequest): NextResponse | null {
  if (getUserRole(req) !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  return null
}
