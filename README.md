# Table d'Adrian Farcaster Wellness App

A production-ready Farcaster mini app for Table d'Adrian's luxury wellness brand. Users hold 5M+ $tabledadrian tokens to access personalized wellness plans and earn rewards.

## Features

- **Token Gating**: Requires 5M+ $tabledadrian tokens to access
- **Rewards System**: 
  - Social engagement reward (2M tokens): Repost + Follow @tabledadrian
  - Holder bonus (2M tokens): Hold 10M+ tokens
  - Max 4M tokens per user
- **Wellness Assessment**: 5-question form for personalized plans
- **PDF Generation**: Creates personalized wellness PDFs with recipes, supplements, and protocols
- **IPFS Storage**: PDFs stored on Pinata with 24-hour expiry links

## Tech Stack

- Next.js 14+ with TypeScript
- Supabase (PostgreSQL) for database
- Pinata for IPFS storage
- viem for blockchain interactions
- Farcaster Frames SDK
- PDFKit for PDF generation
- TailwindCSS for styling

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file with the following:

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

### 3. Database Setup

Run the SQL schema in your Supabase project:

```bash
# Copy the contents of supabase/schema.sql and run in Supabase SQL Editor
```

The schema creates three tables:
- `users`: User wallet addresses and token balances
- `assessments`: Wellness assessments and PDF links
- `user_rewards`: Reward claim tracking

### 4. Deploy

Deploy to Vercel:

```bash
vercel
```

Or use your preferred hosting platform.

## API Endpoints

### Frame Endpoint
- `POST /api/frame` - Main Farcaster frame handler

### Eligibility & Rewards
- `GET /api/check-eligibility?walletAddress=...` - Check if user holds 5M+ tokens
- `GET /api/check-rewards?walletAddress=...&farcasterUsername=...` - Check available rewards
- `POST /api/claim-reward` - Claim social or holder bonus reward

### Assessment & PDF
- `POST /api/get-or-create-user` - Get or create user record
- `POST /api/create-assessment` - Create wellness assessment
- `POST /api/generate-wellness-pdf` - Generate personalized PDF
- `GET /api/user-assessments?walletAddress=...` - Get user's past assessments

### Images (for Farcaster frames)
- `GET /api/images/gate?balance=...` - Gate screen image
- `GET /api/images/main-menu?balance=...` - Main menu image
- `GET /api/images/rewards` - Rewards screen image
- `GET /api/images/assessment-start` - Assessment start image

## User Flow

1. User opens Farcaster frame
2. Connect wallet
3. System checks if user holds 5M+ $tabledadrian
4. If eligible, user can:
   - Claim rewards (social engagement + holder bonus)
   - Start wellness assessment
   - View past wellness plans
5. Complete 5-question assessment
6. System generates personalized PDF
7. User downloads PDF (24-hour expiry link)

## Rewards System

Rewards are tracked in the database but not automatically distributed. You'll need to:

1. Monitor the `user_rewards` table for new claims
2. Distribute $tabledadrian tokens to user wallets manually or via a distribution contract
3. Update the `total_rewards_earned` field after distribution

## PDF Generation

PDFs are generated using templates based on:
- User's stated goal
- Current challenges
- Lifestyle activity level
- Dietary preferences
- Health conditions

Each PDF includes:
- Personalized assessment summary
- Problem analysis & recommendations
- 30-day nutrition protocol
- 3-4 tailored recipes
- Supplement & nutrient protocol
- 30-day meal plan
- Lifestyle & stress protocol
- FAQ & troubleshooting

## Farcaster Integration

The app uses Farcaster Frames SDK for:
- Wallet connection
- User verification
- Frame button interactions
- Social engagement verification (requires Neynar API integration)

## Notes

- Token name is **$tabledadrian** (not $TA)
- Minimum eligibility: 5,000,000 tokens
- Holder bonus threshold: 10,000,000 tokens
- PDF links expire after 24 hours
- Social reward verification requires Farcaster API integration (currently placeholder)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

Private - Table d'Adrian

