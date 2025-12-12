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
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    // Get Supabase client with proper error handling
    const supabase = getSupabaseClient()
    
    // Check user rewards/assessments
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (userError && userError.code !== 'PGRST116') throw userError

    let assessments = []
    let userRewards = null

    if (user) {
      // Get user assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (assessmentsError) throw assessmentsError

      // Get user rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('user_rewards')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (rewardsError && rewardsError.code !== 'PGRST116') throw rewardsError

      assessments = assessmentsData || []
      userRewards = rewardsData
    }

    return NextResponse.json({
      success: true,
      rewards: {
        walletAddress,
        assessments,
        totalAssessments: assessments.length,
        userRewards,
      },
    })
  } catch (error) {
    console.error('Check rewards error:', error)
    return NextResponse.json(
      { error: 'Failed to check rewards' },
      { status: 500 }
    )
  }
}