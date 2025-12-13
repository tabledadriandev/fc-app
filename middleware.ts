import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Create response with CSP headers for production
  const response = NextResponse.next()
  
  // Add comprehensive CSP headers for production
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://explorer-api.walletconnect.com https://walletconnect.com https://*.walletconnect.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: https://explorer-api.walletconnect.com https://walletconnect.com https://*.walletconnect.com https://api.replicate.com https://image.pollinations.ai https://mainnet.base.org https://api.thegraph.com",
    "frame-src 'self' https://walletconnect.com https://*.walletconnect.com",
    "worker-src 'self' blob:",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // Additional security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
}