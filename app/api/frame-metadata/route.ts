import { NextRequest, NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Farcaster Frame Metadata Endpoint
 * This provides metadata about the frame for discovery
 */
export async function GET(req: NextRequest) {
  const metadata = {
    name: "Table d'Adrian Wellness Plans",
    description: "Personalized wellness plans powered by Table d'Adrian. Hold 5M+ $tabledadrian to access AI-generated nutrition protocols, recipes, and supplement plans.",
    image: `${APP_URL}/api/images/main-menu`,
    home_url: "https://tabledadrian.com",
    app_url: `${APP_URL}/api/frame`,
  }

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

