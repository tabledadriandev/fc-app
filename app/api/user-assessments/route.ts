import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (!user) {
      return NextResponse.json([])
    }

    // Get assessments
    const { data: assessments, error } = await supabaseAdmin
      .from('assessments')
      .select('id, goal, pdf_url, created_at, pdf_expires_at, downloaded_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching assessments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assessments' },
        { status: 500 }
      )
    }

    return NextResponse.json(assessments || [])
  } catch (error) {
    console.error('User assessments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

