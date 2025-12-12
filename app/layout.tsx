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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress WalletConnect CSP errors - we use Farcaster wallet provider
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  // Suppress WalletConnect CSP violations (non-critical, we use Farcaster wallet)
                  if (message.includes('Content Security Policy') && 
                      (message.includes('walletconnect.com') || message.includes('WalletConnect'))) {
                    return; // Suppress these errors
                  }
                  originalError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

