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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://explorer-api.walletconnect.com https://walletconnect.com https://*.walletconnect.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: wss: https://explorer-api.walletconnect.com https://walletconnect.com https://*.walletconnect.com https://api.replicate.com https://image.pollinations.ai https://mainnet.base.org https://api.thegraph.com",
      "frame-src 'self' https://walletconnect.com https://*.walletconnect.com",
      "worker-src 'self' blob:",
    ].join('; ')
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

