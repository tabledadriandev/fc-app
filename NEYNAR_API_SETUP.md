# Neynar API Setup for Auto-Fetch Farcaster User Data

## Required Environment Variable

To enable the Auto-Fetch User Data from Farcaster feature, you need to set up a Neynar API key.

### Step 1: Get Free Neynar API Key
1. Visit [neynar.com](https://neynar.com)
2. Sign up for a free account
3. Navigate to the API section
4. Copy your API key

### Step 2: Set Environment Variable
Add this to your `.env.local` file:

```bash
NEYNAR_API_KEY=your_actual_api_key_here
```

### Step 3: Deploy
The API route will automatically use this key to fetch Farcaster user data.

## Features Enabled
- ✅ Automatic Farcaster profile detection via wallet address
- ✅ Profile display with PFP, bio, follower/following counts  
- ✅ Recent casts with engagement metrics
- ✅ One-click DNA checking and profile confirmation
- ✅ Seamless user switching capability

## API Endpoints Used
- `GET /v2/farcaster/user/by_verification?address=${walletAddress}`
- `GET /v2/farcaster/feed/user/casts?fid=${user.fid}&limit=10`

Both endpoints require the `X-API-KEY` header with your Neynar API key.