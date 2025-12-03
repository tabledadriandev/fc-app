import { NextRequest, NextResponse } from 'next/server'
import { FrameRequest, getFrameMessage } from '@farcaster/frames.js'
import { checkEligibility } from '@/lib/blockchain'
import { supabaseAdmin } from '@/lib/supabase'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const body: FrameRequest = await req.json()
    
    const message = await getFrameMessage(body, {
      neynarApiKey: process.env.FARCASTER_SECRET_KEY!,
    })

    if (!message || !message.valid) {
      return new NextResponse('Invalid frame message', { status: 400 })
    }

    const walletAddress = message.interactor?.verified_accounts?.[0] || message.interactor?.custody_address
    const farcasterUsername = message.interactor?.username || ''

    if (!walletAddress) {
      return new NextResponse('No wallet address found', { status: 400 })
    }

    // Check eligibility
    const eligibility = await checkEligibility(walletAddress)

    // Update or create user in database
    const { data: user } = await supabaseAdmin
      .from('users')
      .upsert({
        wallet_address: walletAddress,
        farcaster_username: farcasterUsername,
        ta_token_balance: eligibility.balanceRaw.toString(),
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'wallet_address',
      })
      .select()
      .single()

    if (!eligibility.eligible) {
      // Show gate screen
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${APP_URL}/api/images/gate?balance=${eligibility.balance}" />
  <meta property="fc:frame:button:1" content="Check Balance" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:2" content="Buy $tabledadrian" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="https://tabledadrian.com/buy" />
</head>
<body></body>
</html>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    // Main menu for eligible users
    const buttonIndex = body.untrustedData?.buttonIndex || 1

    if (buttonIndex === 1) {
      // Claim Rewards
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${APP_URL}/api/images/rewards?wallet=${walletAddress}" />
  <meta property="fc:frame:button:1" content="← Back" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:2" content="Verify & Claim Social Reward" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:button:2:target" content="${APP_URL}/api/claim-reward" />
  <meta property="fc:frame:button:3" content="Claim Holder Bonus" />
  <meta property="fc:frame:button:3:action" content="post" />
  <meta property="fc:frame:button:3:target" content="${APP_URL}/api/claim-reward" />
</head>
<body></body>
</html>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    if (buttonIndex === 2) {
      // Start Assessment
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${APP_URL}/api/images/assessment-start" />
  <meta property="fc:frame:button:1" content="← Back" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:2" content="Start Assessment" />
  <meta property="fc:frame:button:2:action" content="link" />
  <meta property="fc:frame:button:2:target" content="${APP_URL}/assessment?wallet=${walletAddress}" />
</head>
<body></body>
</html>`
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }

    // Default: Show main menu
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${APP_URL}/api/images/main-menu?balance=${eligibility.balance}" />
  <meta property="fc:frame:button:1" content="Claim Rewards" />
  <meta property="fc:frame:button:1:action" content="post" />
  <meta property="fc:frame:button:2" content="Start Assessment" />
  <meta property="fc:frame:button:2:action" content="post" />
  <meta property="fc:frame:button:3" content="View My Plans" />
  <meta property="fc:frame:button:3:action" content="link" />
  <meta property="fc:frame:button:3:target" content="${APP_URL}/plans?wallet=${walletAddress}" />
</head>
<body></body>
</html>`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Frame error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

