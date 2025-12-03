# Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

## Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Farcaster Configuration
FARCASTER_SECRET_KEY=your_farcaster_secret_key
FARCASTER_APP_ID=your_farcaster_app_id

# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
PINATA_JWT=your_pinata_jwt_token

# Base Network Configuration
BASE_RPC_URL=https://mainnet.base.org
TA_TOKEN_ADDRESS=0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07
TA_TOKEN_DECIMALS=18

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## How to Get Each Variable

### Supabase
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Project Settings > API
3. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Farcaster
1. Go to [Neynar](https://neynar.com) or [Warpcast](https://warpcast.com)
2. Create a Farcaster app
3. Copy:
   - API Key → `FARCASTER_SECRET_KEY`
   - App ID → `FARCASTER_APP_ID`

### Pinata
1. Go to [pinata.cloud](https://pinata.cloud) and create an account
2. Go to API Keys section
3. Create a new API key with `pinFileToIPFS` permission
4. Copy:
   - API Key → `PINATA_API_KEY`
   - Secret Key → `PINATA_SECRET_KEY`
   - JWT Token → `PINATA_JWT`

### Base Network
- `BASE_RPC_URL`: Use public RPC or get one from [Alchemy](https://alchemy.com) or [Infura](https://infura.io)
- `TA_TOKEN_ADDRESS`: Already set to `0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07`
- `TA_TOKEN_DECIMALS`: `18` (standard ERC20)

### App URL
- For local development: `http://localhost:3000`
- For production: Your Vercel/deployment URL (e.g., `https://tabledadrian.vercel.app`)

## Security Notes

- **Never commit `.env.local` to git** (it's in `.gitignore`)
- Keep `SUPABASE_SERVICE_ROLE_KEY` and `FARCASTER_SECRET_KEY` secret
- Use environment variables in Vercel/deployment platform settings
- Rotate keys if they're ever exposed

