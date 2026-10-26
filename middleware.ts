import { NextRequest, NextResponse } from 'next/server';

import {
AUTH_COOKIE,
verifySession,
} from '@/lib/aut';

export async function middleware(
request: NextRequest
) {
const { pathname } = request.nextUrl;

const token =
request.cookies.get(AUTH_COOKIE)?.value;

const session = token
? await verifySession(token)
: null;

const isAdminRoute =
pathname === '/admin' ||
pathname.startsWith('/admin/');

const isLoginRoute =
pathname === '/login';

// کاربر وارد نشده و می‌خواهد وارد پنل شود
if (isAdminRoute && !session) {
const loginUrl = new URL(
'/login',
request.url
);


loginUrl.searchParams.set(
  'from',
  pathname
);

return NextResponse.redirect(loginUrl);


}

// کاربر وارد شده و دوباره /login را باز کرده
if (isLoginRoute && session) {
return NextResponse.redirect(
new URL('/admin', request.url)
);
}

return NextResponse.next();
}

export const config = {
matcher: [
'/admin/:path*',
'/login',
],
};
