import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  // If Meta sends webhook verification (GET) or event (POST) to root URL '/' instead of '/api/webhook'
  if (
    pathname === '/' &&
    (searchParams.get('hub.mode') === 'subscribe' || request.headers.has('x-hub-signature-256'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/webhook';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
