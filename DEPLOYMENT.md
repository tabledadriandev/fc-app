# Deployment Guide

## Prerequisites

1. Node.js 18+ installed
2. Supabase project created
3. Pinata account set up
4. Farcaster app registered
5. Vercel account (or your preferred hosting)

## Step 1: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the schema from `supabase/schema.sql`:
   ```sql
   -- Copy and paste the entire contents of supabase/schema.sql
   ```
4. (Optional) Run `supabase/functions.sql` for helper functions

## Step 2: Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` file (see `ENV_SETUP.md`)
4. Run development server:
   ```bash
   npm run dev
   ```
5. Test locally at `http://localhost:3000`

## Step 3: Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`
5. Deploy

## Step 4: Configure Farcaster Frame

1. Get your deployed app URL (e.g., `https://tabledadrian.vercel.app`)
2. Your frame URL will be: `https://tabledadrian.vercel.app/api/frame`
3. Test the frame in Warpcast:
   - Post a cast with your frame URL
   - Click the frame to test

## Step 5: Post-Deployment Checklist

- [ ] Test token gating (try with wallet that has < 5M tokens)
- [ ] Test eligibility check API
- [ ] Test rewards claim flow
- [ ] Test assessment form submission
- [ ] Test PDF generation
- [ ] Verify PDF uploads to IPFS
- [ ] Test PDF download links
- [ ] Verify 24-hour expiry works
- [ ] Test on Farcaster frame

## Troubleshooting

### PDF Generation Fails
- Check Pinata API keys are correct
- Verify file size limits
- Check server logs for errors

### Token Balance Not Loading
- Verify Base RPC URL is accessible
- Check token contract address is correct
- Ensure wallet address format is correct (0x...)

### Supabase Errors
- Verify all Supabase env variables are set
- Check database tables exist
- Verify RLS policies (if enabled)

### Farcaster Frame Not Working
- Verify `FARCASTER_SECRET_KEY` is correct
- Check frame URL is accessible
- Ensure frame response format is correct

## Production Considerations

1. **Rate Limiting**: Add rate limiting to API endpoints
2. **Error Monitoring**: Set up Sentry or similar
3. **Analytics**: Track frame interactions
4. **Backup**: Regular database backups
5. **Rewards Distribution**: Set up automated or manual distribution system

## Support

For issues or questions, check:
- Farcaster Frames docs: https://docs.farcaster.xyz
- Supabase docs: https://supabase.com/docs
- Pinata docs: https://docs.pinata.cloud

