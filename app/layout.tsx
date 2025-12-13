import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Join the Future of DeSci',
  description:
    'A token-gated DeSci whitelist experience powered by the $tabledadrian token on Base.',
  manifest: '/manifest.json',
  other: {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://explorer-api.walletconnect.com https://walletconnect.com https://*.walletconnect.com https://client.warpcast.com https://client.farcaster.xyz https://farcaster.xyz https://warpcast.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.warpcast.com https://client.farcaster.xyz",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: https://client.warpcast.com https://client.farcaster.xyz",
      "connect-src 'self' https: wss: https://explorer-api.walletconnect.com https://explorer-api.walletconnect.com/v3/wallets https://walletconnect.com https://*.walletconnect.com https://client.warpcast.com https://client.farcaster.xyz https://api.replicate.com https://image.pollinations.ai https://mainnet.base.org https://api.thegraph.com https://farcaster.xyz https://warpcast.com https://privy.farcaster.xyz https://privy.warpcast.com https://auth.privy.io https://*.rpc.privy.systems https://cloudflareinsights.com",
      "frame-src 'self' https://walletconnect.com https://*.walletconnect.com https://client.warpcast.com https://client.farcaster.xyz https://farcaster.xyz https://warpcast.com",
      "frame-ancestors 'self' https://client.warpcast.com https://client.farcaster.xyz",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://explorer-api.walletconnect.com" />
        <link rel="preconnect" href="https://walletconnect.com" />
        <link rel="dns-prefetch" href="https://explorer-api.walletconnect.com" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

