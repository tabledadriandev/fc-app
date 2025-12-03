import type { Metadata } from 'next'
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

