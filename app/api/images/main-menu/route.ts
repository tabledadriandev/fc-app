import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const balance = searchParams.get('balance') || '0'

  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#grad)"/>
      <text x="600" y="200" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="white" text-anchor="middle">
        Table d'Adrian
      </text>
      <text x="600" y="280" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">
        Welcome to Your Wellness Journey
      </text>
      <text x="600" y="360" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.9)" text-anchor="middle">
        Balance: ${parseFloat(balance).toLocaleString()} $tabledadrian
      </text>
      <text x="600" y="450" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.8)" text-anchor="middle">
        Claim Rewards • Start Assessment • View Plans
      </text>
    </svg>
  `.trim()

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  })
}

