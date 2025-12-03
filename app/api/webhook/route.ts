import { NextRequest, NextResponse } from 'next/server'

/**
 * Farcaster Mini App webhook endpoint.
 *
 * The URL is configured in `.well-known/farcaster.json` as:
 *   https://fc-app-sandy.vercel.app/api/webhook
 *
 * For now this is a no-op handler that:
 * - Accepts POST requests from Farcaster clients
 * - Logs the payload on the server (for debugging)
 * - Returns a 200 OK JSON response
 *
 * You can later extend this to:
 * - Persist whitelist joins
 * - Trigger notifications
 * - Call other backend services
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)

    console.log('Received Farcaster webhook payload:', body)

    return NextResponse.json(
      {
        ok: true,
        message: 'Webhook received',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error handling webhook:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal error handling webhook',
      },
      { status: 500 }
    )
  }
}


