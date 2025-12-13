import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // COMPREHENSIVE CSP CONFIGURATION FOR WALLETCONNECT & FARSCASTER INTEGRATION
  const cspHeader = [
    // Core security policies
    "default-src 'self'",
    
    // Script sources - WalletConnect & Farcaster SDKs + AI services
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://walletconnect.com https://*.walletconnect.com https://explorer-api.walletconnect.com https://explorer-api.walletconnect.com/v2 https://explorer-api.walletconnect.com/v3 https://client.warpcast.com https://client.farcaster.xyz https://farcaster.xyz https://warpcast.com https://api.replicate.com https://image.pollinations.ai https://replicate.com",
    
    // Style sources - Fonts, Farcaster styling
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.warpcast.com https://client.farcaster.xyz https://fonts.gstatic.com",
    
    // Font sources
    "font-src 'self' https://fonts.gstatic.com",
    
    // Image sources - Profile pictures, NFT images, API responses
    "img-src 'self' data: https: blob: https://client.warpcast.com https://client.farcaster.xyz https://explorer-api.walletconnect.com https://gateway.pinata.cloud https://ipfs.io https://imagedelivery.net",
    
    // CONNECT SOURCES - COMPREHENSIVE WALLETCONNECT & FARSCASTER APIs
    "connect-src 'self' https: wss: https://walletconnect.com https://*.walletconnect.com https://explorer-api.walletconnect.com https://explorer-api.walletconnect.com/v2 https://explorer-api.walletconnect.com/v3/wallets https://registry.walletconnect.com https://api.walletconnect.com https://client.warpcast.com https://client.farcaster.xyz https://farcaster.xyz https://warpcast.com https://api.replicate.com https://image.pollinations.ai https://mainnet.base.org https://api.thegraph.com https://privy.farcaster.xyz https://privy.warpcast.com https://auth.privy.io https://*.rpc.privy.systems https://cloudflareinsights.com https://www.walletlink.org",
    
    // FRAME SOURCES - WalletConnect modals & Farcaster embedding
    "frame-src 'self' https://walletconnect.com https://*.walletconnect.com https://client.warpcast.com https://client.farcaster.xyz https://farcaster.xyz https://warpcast.com https://www.walletlink.org",
    
    // FRAME ANCESTORS - Allow Farcaster frame embedding
    "frame-ancestors 'self' https://client.warpcast.com https://client.farcaster.xyz https://farcaster.xyz https://warpcast.com",
    
    // Worker sources for background processing
    "worker-src 'self' blob:",
    
    // Security restrictions
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    
    // Media permissions
    "media-src 'self' blob:",
  ].join('; ')
  
  // Set unified CSP
  response.headers.set('Content-Security-Policy', cspHeader)
  
  // Fix X-Frame-Options for iframe embedding while maintaining security
  response.headers.set('X-Frame-Options', 'ALLOW-FROM https://client.warpcast.com https://client.farcaster.xyz')
  
  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // CSP Report-Only for monitoring violations (remove in production)
  if (process.env.NODE_ENV === 'development') {
    const reportOnlyCsp = cspHeader.replace(/;/g, '; report-to csp-endpoint;')
    response.headers.set('Content-Security-Policy-Report-Only', reportOnlyCsp)
  }
  
  // Handle API CORS for Farcaster integration
  const url = new URL(request.url)
  if (url.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  }
  
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