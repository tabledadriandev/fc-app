-- Update TA NFT Mints Table to include cast data
ALTER TABLE ta_nft_mints ADD COLUMN IF NOT EXISTS cast_text TEXT;
ALTER TABLE ta_nft_mints ADD COLUMN IF NOT EXISTS cast_hash TEXT;
ALTER TABLE ta_nft_mints ADD COLUMN IF NOT EXISTS cast_timestamp TIMESTAMP;
ALTER TABLE ta_nft_mints ADD COLUMN IF NOT EXISTS pfp_url TEXT;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_ta_nft_minted_at_desc ON ta_nft_mints(minted_at DESC);

