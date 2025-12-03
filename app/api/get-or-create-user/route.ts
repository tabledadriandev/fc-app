import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getTokenBalance } from '@/lib/blockchain'

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (existingUser) {
      // Update balance and last accessed
      const balance = await getTokenBalance(walletAddress)
      await supabaseAdmin
        .from('users')
        .update({
          ta_token_balance: balance.toString(),
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)

      return NextResponse.json({ userId: existingUser.id })
    }

    // Create new user
    const balance = await getTokenBalance(walletAddress)
    const { data: newUser, error } = await supabaseAdmin
      .from('users')
      .insert({
        wallet_address: walletAddress,
        ta_token_balance: balance.toString(),
      })
      .select()
      .single()

    if (error || !newUser) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    // Create rewards record
    await supabaseAdmin.from('user_rewards').insert({
      user_id: newUser.id,
    })

    return NextResponse.json({ userId: newUser.id })
  } catch (error) {
    console.error('Get or create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

