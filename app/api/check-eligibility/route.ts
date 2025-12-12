import { NextRequest, NextResponse } from 'next/server'
import { getTokenBalance, formatTokenAmount } from '@/lib/blockchain'
import { computeBalanceEurValue } from '@/lib/pricing'
import { MIN_EUR_VALUE_REQUIREMENT } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    // Get token balance
    const rawBalance = await getTokenBalance(walletAddress)
    const { eurValue, tokenAmount, meetsRequirement } =
      await computeBalanceEurValue(rawBalance)

    return NextResponse.json({
      success: true,
      eligibility: {
        walletAddress,
        tokenAmount,
        eurValue,
        meetsRequirement,
        requiredAmount: MIN_EUR_VALUE_REQUIREMENT,
        formattedBalance: `${Number(tokenAmount).toLocaleString()} TA`,
      },
    })
  } catch (error) {
    console.error('Check eligibility error:', error)
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    )
  }
}