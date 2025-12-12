# 🔍 How to Find Your Liquidity Pool Address

## What is a Liquidity Pool?

When you created your token ($tabledadrian), you probably added liquidity to a DEX (like Uniswap, PancakeSwap, etc.). The **liquidity pool** is the contract address where that liquidity lives.

## Where to Find It:

### Option 1: Check Your .env File (Easiest!)

1. Open your `.env` file in the project
2. Look for this line:
   ```
   NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS=0x...
   ```
3. Copy that address - **THAT'S IT!** ✅

### Option 2: If You Don't Have It in .env

#### For Uniswap V2/V3:
1. Go to https://basescan.org
2. Search for your token address (from `NEXT_PUBLIC_TA_TOKEN_ADDRESS`)
3. Look at the token's transactions
4. Find the transaction where you added liquidity
5. The "To" address in that transaction is usually the pool address

#### For PancakeSwap:
1. Go to https://pancakeswap.finance
2. Connect your wallet
3. Go to "Liquidity" section
4. Find your token pair
5. Click on it - the pool address will be shown

#### For BaseSwap or Other DEX:
1. Go to the DEX website
2. Find your token pair
3. The pool address is usually shown in the URL or on the page

### Option 3: Use a Token Explorer

1. Go to https://basescan.org
2. Search your token: `NEXT_PUBLIC_TA_TOKEN_ADDRESS`
3. Click on your token
4. Look for "Holders" or "Token Tracker"
5. Find the pool address (usually has a lot of tokens)

### Option 4: Check Your Wallet Transactions

1. Open MetaMask
2. Go to "Activity" tab
3. Find the transaction where you added liquidity
4. Click on it
5. Look at the contract address it interacted with - that's your pool!

## What It Looks Like:

Your liquidity pool address should look like:
```
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```
- Starts with `0x`
- Exactly 42 characters
- This is where the 0.003 ETH payments go when people mint NFTs

## Quick Check:

If you're not sure, you can:
1. Check your `.env` file first
2. If it's not there, check where you created the liquidity pool
3. Or use BaseScan to find transactions with your token

## For Deployment:

When deploying in Remix:
- **First box** (`initialOwner`): Your wallet address
- **Second box** (`_liquidityPool`): Your liquidity pool address (from above)

Both should be 42 characters starting with `0x`!

