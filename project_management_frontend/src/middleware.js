// middleware.js
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session')?.value

  console.log(` Middleware: ${pathname}, Token: ${sessionToken ? 'exists' : 'missing'}`)

  // Public routes - anyone can access
  if (pathname === '/register' || pathname === '/login') {
    return NextResponse.next()
  }

  // Protected routes - must have session token
  if (pathname === '/create-organization' || pathname.startsWith('/dashboard')) {
    if (!sessionToken) {
      console.log('No session token, redirecting to register')
      return NextResponse.redirect(new URL('/register', request.url))
    }

    // For dashboard routes, add header to check organization
    if (pathname.startsWith('/dashboard')) {
      const response = NextResponse.next()
      response.headers.set('x-check-organization', 'true')
      return response
    }

    // For create-organization, just let it through (page will handle org check)
    return NextResponse.next()
  }

  // All other routes - let them through for now
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}