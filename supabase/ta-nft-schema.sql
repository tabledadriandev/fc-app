-- TA NFT Mints Table
CREATE TABLE IF NOT EXISTS ta_nft_mints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  username TEXT NOT NULL,
  nft_image_url TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  ta_balance_at_mint FLOAT,
  minted_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ta_nft_wallet ON ta_nft_mints(wallet_address);
CREATE INDEX IF NOT EXISTS idx_ta_nft_username ON ta_nft_mints(username);
CREATE INDEX IF NOT EXISTS idx_ta_nft_tx_hash ON ta_nft_mints(tx_hash);
CREATE INDEX IF NOT EXISTS idx_ta_nft_minted_at ON ta_nft_mints(minted_at);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE ta_nft_mints ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own mints
CREATE POLICY "Users can view their own mints" ON ta_nft_mints
  FOR SELECT USING (auth.uid()::text = wallet_address);

-- Policy to allow inserts (for recording mints)
CREATE POLICY "Allow insert for mint recording" ON ta_nft_mints
  FOR INSERT WITH CHECK (true);

-- Update users table to include TA token balance if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS ta_token_balance FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP DEFAULT NOW();