import { NextRequest, NextResponse } from 'next/server'
import { checkHolderBonus } from '@/lib/blockchain'
import { verifySocialEngagement } from '@/lib/farcaster'
import { supabaseAdmin } from '@/lib/supabase'

const REWARD_AMOUNT = 2_000_000n * 10n ** 18n // 2M tokens

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const walletAddress = searchParams.get('walletAddress')
    const farcasterUsername = searchParams.get('farcasterUsername') || ''

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required' },
        { status: 400 }
      )
    }

    // Get user rewards record
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single()

    if (!user) {
      return NextResponse.json({
        socialRewardAvailable: false,
        holderBonusAvailable: false,
        socialRewardClaimed: false,
        holderBonusClaimed: false,
        totalRewardsAvailable: 0,
      })
    }

    const { data: rewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const socialRewardClaimed = rewards?.social_reward_claimed || false
    const holderBonusClaimed = rewards?.holder_bonus_claimed || false

    // Check social engagement
    const socialEngagement = await verifySocialEngagement(farcasterUsername)
    const socialRewardAvailable = socialEngagement.verified && !socialRewardClaimed

    // Check holder bonus
    const holderBonusAvailable = await checkHolderBonus(walletAddress) && !holderBonusClaimed

    // Calculate total available rewards
    let totalRewardsAvailable = 0
    if (socialRewardAvailable) totalRewardsAvailable += 2_000_000
    if (holderBonusAvailable) totalRewardsAvailable += 2_000_000

    return NextResponse.json({
      socialRewardAvailable,
      holderBonusAvailable,
      socialRewardClaimed,
      holderBonusClaimed,
      totalRewardsAvailable,
      socialEngagement: {
        reposted: socialEngagement.reposted,
        following: socialEngagement.following,
      },
    })
  } catch (error) {
    console.error('Rewards check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

