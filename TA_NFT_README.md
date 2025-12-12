# Table d'Adrian TA NFT Generator

A Farcaster mini-app that generates and mints custom TA (Table d'Adrian) NFT portraits using AI.

## Features

- **Wallet Connection**: Connect with Farcaster wallet
- **User DNA Check**: Verify TA token balance and user data
- **AI Portrait Generation**: Create custom chef portraits using Replicate AI
- **NFT Minting**: Mint to liquidity pool with 0.003 ETH
- **Database Tracking**: Track all mints in Supabase

## API Endpoints

### `POST /api/check-user`
Check user eligibility and TA token balance.

**Request:**
```json
{
  "walletAddress": "0x...",
  "farcasterUsername": "@username",
  "pfpUrl": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "walletAddress": "0x...",
    "username": "@username",
    "pfpUrl": "https://...",
    "taBalance": 100.5
  }
}
```

### `POST /api/generate-ta-nft`
Generate AI portrait using Replicate.

**Request:**
```json
{
  "pfpUrl": "https://...",
  "username": "@username",
  "taBalance": 100.5
}
```

**Response:**
```json
{
  "success": true,
  "nftImage": "https://...",
  "nftMetadata": {
    "name": "TA NFT: @username",
    "description": "Table d'Adrian Luxury Chef NFT",
    "image": "https://...",
    "artist": "Table d'Adrian",
    "collection": "TA Chef Collection"
  }
}
```

### `POST /api/mint-ta-nft`
Prepare mint transaction to liquidity pool.

**Request:**
```json
{
  "walletAddress": "0x...",
  "nftImageUrl": "https://...",
  "username": "@username"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "to": "0x...",
    "value": "3000000000000000",
    "chainId": 8453,
    "data": "0x"
  },
  "nft": {
    "imageUrl": "https://...",
    "username": "@username",
    "name": "TA NFT: @username",
    "collection": "Table d'Adrian Chef Collection",
    "price": "0.003 ETH",
    "destination": "Liquidity Pool (+$TA value)"
  }
}
```

### `POST /api/record-mint`
Record mint in database.

**Request:**
```json
{
  "walletAddress": "0x...",
  "username": "@username",
  "nftImageUrl": "https://...",
  "txHash": "0x...",
  "taBalance": 100.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mint recorded"
}
```

## Environment Variables

Required environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_TA_TOKEN_ADDRESS=0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07
NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...

# AI Generation
REPLICATE_API_TOKEN=your_replicate_token

# Farcaster
FARCASTER_SECRET_KEY=your_secret_key
FARCASTER_APP_ID=your_app_id
```

## Database Schema

Run the SQL in `supabase/ta-nft-schema.sql` to create the required tables:

```sql
-- TA NFT Mints Table
CREATE TABLE ta_nft_mints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  username TEXT NOT NULL,
  nft_image_url TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  ta_balance_at_mint FLOAT,
  minted_at TIMESTAMP DEFAULT NOW()
);

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS ta_token_balance FLOAT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP DEFAULT NOW();
```

## Usage

1. **Navigate to TA NFT Generator**: `/ta-nft`
2. **Connect Wallet**: Connect your Farcaster wallet
3. **Enter Details**: Provide username and optional PFP URL
4. **Check Eligibility**: System verifies TA token balance
5. **Generate Portrait**: AI creates custom chef NFT
6. **Preview & Mint**: Review and mint to liquidity pool

## Component Structure

- `TANFTMinter.tsx`: Main component with multi-step flow
- `app/ta-nft/page.tsx`: Page wrapper
- API routes handle backend logic

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Blockchain**: Viem, Wagmi
- **AI**: Replicate
- **Deployment**: Vercel

## Flow Diagram

```
Connect Wallet → Enter Username → Check TA Balance → 
Generate AI Portrait → Preview NFT → Mint to Pool → Record in DB
```

## Notes

- Uses Base network (Chain ID: 8453)
- Mint cost: 0.003 ETH to liquidity pool
- AI models: mirage-ghibli (PFP transform) or animagine-xl-3.1 (from scratch)
- Supports both PFP transformation and text-to-image generation