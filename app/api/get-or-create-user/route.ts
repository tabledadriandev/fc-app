import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Supabase URL or key missing in environment')
  }
  
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, farcasterUsername, pfpUrl } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    // Get or create user in database
    const supabase = getSupabaseClient()
    
    const { data: user, error: dbError } = await supabase
      .from('users')
      .upsert(
        [
          {
            wallet_address: walletAddress,
            farcaster_username: farcasterUsername,
            pfp_url: pfpUrl,
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'wallet_address' }
      )
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress,
        username: farcasterUsername,
        pfpUrl,
      },
    })
  } catch (error) {
    console.error('Get or create user error:', error)
    return NextResponse.json(
      { error: 'Failed to get or create user' },
      { status: 500 }
    )
  }
}