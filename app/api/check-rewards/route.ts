import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    // Check user rewards/assessments
    const { data: assessments, error } = await supabase
      .from('user_assessments')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      rewards: {
        walletAddress,
        assessments: assessments || [],
        totalAssessments: assessments?.length || 0,
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