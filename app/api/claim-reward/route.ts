import { NextRequest, NextResponse } from 'next/server'
import { getFrameMessage } from '@farcaster/frames.js'
import { checkHolderBonus } from '@/lib/blockchain'
import { verifySocialEngagement } from '@/lib/farcaster'
import { supabaseAdmin } from '@/lib/supabase'

const REWARD_AMOUNT = 2_000_000n * 10n ** 18n // 2M tokens

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const message = await getFrameMessage(body, {
      neynarApiKey: process.env.FARCASTER_SECRET_KEY!,
    })

    if (!message || !message.valid) {
      return NextResponse.json(
        { error: 'Invalid frame message' },
        { status: 400 }
      )
    }

    const walletAddress = message.interactor?.verified_accounts?.[0] || message.interactor?.custody_address
    const farcasterUsername = message.interactor?.username || ''
    const buttonIndex = body.untrustedData?.buttonIndex || 1

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'No wallet address found' },
        { status: 400 }
      )
    }

    // Get or create user
    const { data: user } = await supabaseAdmin
      .from('users')
      .upsert({
        wallet_address: walletAddress,
        farcaster_username: farcasterUsername,
      }, {
        onConflict: 'wallet_address',
      })
      .select()
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get or create rewards record
    const { data: rewards } = await supabaseAdmin
      .from('user_rewards')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Determine reward type based on button
    const isSocialReward = buttonIndex === 2
    const isHolderBonus = buttonIndex === 3

    if (isSocialReward) {
      // Verify social engagement
      const socialEngagement = await verifySocialEngagement(farcasterUsername)
      
      if (!socialEngagement.verified) {
        return NextResponse.json({
          success: false,
          message: 'Please repost and follow @tabledadrian first',
        })
      }

      if (rewards?.social_reward_claimed) {
        return NextResponse.json({
          success: false,
          message: 'Social reward already claimed',
        })
      }

      // Claim social reward
      await supabaseAdmin
        .from('user_rewards')
        .upsert({
          user_id: user.id,
          social_reward_claimed: true,
          social_reward_claimed_at: new Date().toISOString(),
          total_rewards_earned: (rewards?.total_rewards_earned || 0) + Number(REWARD_AMOUNT),
        }, {
          onConflict: 'user_id',
        })

      return NextResponse.json({
        success: true,
        rewardAmount: '2000000',
        message: '2M $tabledadrian claimed! Check back in 24h for distribution.',
        rewardType: 'social',
      })
    }

    if (isHolderBonus) {
      // Check holder bonus eligibility
      const eligible = await checkHolderBonus(walletAddress)
      
      if (!eligible) {
        return NextResponse.json({
          success: false,
          message: 'Hold 10M+ $tabledadrian to claim this bonus',
        })
      }

      if (rewards?.holder_bonus_claimed) {
        return NextResponse.json({
          success: false,
          message: 'Holder bonus already claimed',
        })
      }

      // Claim holder bonus
      await supabaseAdmin
        .from('user_rewards')
        .upsert({
          user_id: user.id,
          holder_bonus_claimed: true,
          holder_bonus_claimed_at: new Date().toISOString(),
          total_rewards_earned: (rewards?.total_rewards_earned || 0) + Number(REWARD_AMOUNT),
        }, {
          onConflict: 'user_id',
        })

      return NextResponse.json({
        success: true,
        rewardAmount: '2000000',
        message: '2M $tabledadrian bonus claimed! Check back in 24h for distribution.',
        rewardType: 'holder',
      })
    }

    return NextResponse.json(
      { error: 'Invalid reward type' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Claim reward error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

