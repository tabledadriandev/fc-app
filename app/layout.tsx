import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Join the Future of DeSci',
  description:
    'A token-gated DeSci whitelist experience powered by the $tabledadrian token on Base.',
  manifest: '/manifest.json',
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
      </head>
      <body>
        {/* Farcaster Mini App SDK for ready() signaling inside clients like Warpcast */}
        <Script
          src="https://cdn.jsdelivr.net/npm/@farcaster/miniapp-sdk/dist/index.min.js"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

