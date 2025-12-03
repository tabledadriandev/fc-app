# Quick Start Guide

Get your Table d'Adrian Farcaster app running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Pinata account (free tier works)
- A Farcaster account with app registration

## Step 1: Clone & Install

```bash
# Install dependencies
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Run the SQL
5. Go to Project Settings > API
6. Copy your project URL and keys

## Step 3: Set Up Pinata

1. Go to [pinata.cloud](https://pinata.cloud) and sign up
2. Go to API Keys
3. Create a new key with `pinFileToIPFS` permission
4. Copy your API key, secret, and JWT

## Step 4: Set Up Farcaster

1. Go to [Neynar](https://neynar.com) or register your app on Warpcast
2. Create a new app
3. Copy your API key and App ID

## Step 5: Configure Environment

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

FARCASTER_SECRET_KEY=your_farcaster_key
FARCASTER_APP_ID=your_app_id

PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
PINATA_JWT=your_pinata_jwt

BASE_RPC_URL=https://mainnet.base.org
TA_TOKEN_ADDRESS=0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07
TA_TOKEN_DECIMALS=18

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 6: Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to test.

## Step 7: Test the Frame

1. Deploy to Vercel (or your preferred host)
2. Get your frame URL: `https://your-app.vercel.app/api/frame`
3. Post a cast on Warpcast with your frame URL
4. Click the frame to test!

## Common Issues

**"Invalid frame message"**
- Check your `FARCASTER_SECRET_KEY` is correct
- Ensure your frame URL is accessible

**PDF generation fails**
- Verify Pinata API keys
- Check file size limits

**Token balance not loading**
- Verify Base RPC URL is accessible
- Check token contract address

## Next Steps

- Customize PDF templates in `lib/pdf-generator.ts`
- Implement Farcaster social verification in `lib/farcaster.ts`
- Set up reward distribution system
- Add analytics and monitoring

For detailed deployment, see `DEPLOYMENT.md`.

