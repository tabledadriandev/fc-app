import { NextRequest, NextResponse } from 'next/server'
import { checkEligibility } from '@/lib/blockchain'

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

    const eligibility = await checkEligibility(walletAddress)

    return NextResponse.json({
      eligible: eligibility.eligible,
      balance: eligibility.balance,
      message: eligibility.message,
    })
  } catch (error) {
    console.error('Eligibility check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

