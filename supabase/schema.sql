-- Table d'Adrian Farcaster App Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farcaster_username TEXT,
  wallet_address TEXT UNIQUE NOT NULL,
  ta_token_balance BIGINT DEFAULT 0,
  assessment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  challenges TEXT NOT NULL,
  lifestyle TEXT NOT NULL,
  dietary TEXT NOT NULL,
  conditions TEXT,
  pdf_generated BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  ipfs_hash TEXT,
  pdf_expires_at TIMESTAMP WITH TIME ZONE,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User rewards table
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  social_reward_claimed BOOLEAN DEFAULT FALSE,
  social_reward_claimed_at TIMESTAMP WITH TIME ZONE,
  holder_bonus_claimed BOOLEAN DEFAULT FALSE,
  holder_bonus_claimed_at TIMESTAMP WITH TIME ZONE,
  total_rewards_earned BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_pdf_expires_at ON assessments(pdf_expires_at);

