import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export interface User {
  id: string
  farcaster_username: string | null
  wallet_address: string
  ta_token_balance: number
  assessment_count: number
  created_at: string
  last_accessed_at: string
}

export interface Assessment {
  id: string
  user_id: string
  goal: string
  challenges: string
  lifestyle: string
  dietary: string
  conditions: string | null
  pdf_generated: boolean
  pdf_url: string | null
  ipfs_hash: string | null
  pdf_expires_at: string | null
  downloaded_at: string | null
  created_at: string
}

export interface UserReward {
  id: string
  user_id: string
  social_reward_claimed: boolean
  social_reward_claimed_at: string | null
  holder_bonus_claimed: boolean
  holder_bonus_claimed_at: string | null
  total_rewards_earned: number
  created_at: string
}

