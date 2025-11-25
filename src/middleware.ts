import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
	'/',
	'/auth/login',
	'/auth/register',
	'/auth/session-error',
	'/auth/refresh-session',
	'/guest',
	'/guest/browse',
];

// Route prefixes that don't require authentication
const publicPrefixes = [
	'/api/auth',
	'/api/register',
	'/api/public',
	'/_next',
	'/images',
	'/icons',
];

// Routes that guests can access (for read-only browsing)
const guestAccessiblePrefixes = [
	'/api/public',
	'/circle/', // Allow viewing public circles
	'/album/', // Allow viewing public albums
];

export default auth((req) => {
	const { pathname } = req.nextUrl;
	const isLoggedIn = !!req.auth;

	// Check if the route is public
	const isPublicRoute = publicRoutes.includes(pathname);
	const isPublicPrefix = publicPrefixes.some(prefix => pathname.startsWith(prefix));
	const isGuestAccessible = guestAccessiblePrefixes.some(prefix => pathname.startsWith(prefix));

	// Allow public routes and static assets
	if (isPublicRoute || isPublicPrefix) {
		return NextResponse.next();
	}

	// For guest accessible routes, allow access but the page components
	// will handle showing limited functionality
	if (isGuestAccessible) {
		return NextResponse.next();
	}

	// Redirect unauthenticated users to login for protected routes
	if (!isLoggedIn) {
		const loginUrl = new URL('/auth/login', req.nextUrl.origin);
		loginUrl.searchParams.set('callbackUrl', pathname);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
});

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder files
		 */
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
};
