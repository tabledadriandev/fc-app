import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Table d\'Adrian - Wellness Plans',
  description: 'Personalized wellness plans powered by Table d\'Adrian',
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
      <body>{children}</body>
    </html>
  )
}

