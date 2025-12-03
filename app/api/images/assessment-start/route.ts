import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#grad)"/>
      <text x="600" y="250" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
        Wellness Assessment
      </text>
      <text x="600" y="320" font-family="Arial, sans-serif" font-size="28" fill="white" text-anchor="middle">
        Get Your Personalized Plan
      </text>
      <text x="600" y="400" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.9)" text-anchor="middle">
        Answer 5 simple questions
      </text>
      <text x="600" y="450" font-family="Arial, sans-serif" font-size="20" fill="rgba(255,255,255,0.9)" text-anchor="middle">
        Receive your custom wellness protocol
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

