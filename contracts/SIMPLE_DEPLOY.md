# 🚀 SIMPLE NFT CONTRACT DEPLOYMENT - STEP BY STEP

## What You Need:
1. MetaMask wallet with some ETH on Base network
2. Your liquidity pool address (from your .env file)

## EASIEST WAY - Use Remix (5 minutes):

### Step 1: Open Remix
- Go to: https://remix.ethereum.org
- That's it, just open it in your browser

### Step 2: Create the Contract File
1. Click "File Explorer" on the left
2. Click the folder icon to create new folder called "contracts"
3. Click "New File" 
4. Name it: `TANFT.sol`
5. Copy ALL the code from `contracts/TANFT.sol` in this project
6. Paste it into Remix

### Step 3: Install OpenZeppelin (the library we need)
1. In Remix, click "Terminal" at the bottom
2. Type this and press Enter:
   ```
   npm install @openzeppelin/contracts
   ```
3. Wait for it to finish (takes 30 seconds)

### Step 4: Compile
1. Click "Solidity Compiler" on the left (looks like a checkmark)
2. Make sure version is 0.8.20 or higher
3. Click "Compile TANFT.sol"
4. Wait for green checkmark ✅

### Step 5: Deploy
1. Click "Deploy & Run Transactions" on the left (looks like a rocket)
2. Make sure "Injected Provider - MetaMask" is selected (this connects MetaMask)
3. **IMPORTANT**: Switch MetaMask to Base network:
   - Open MetaMask
   - Click network dropdown (top)
   - Select "Base" (or add it if you don't have it)
4. In Remix, find "Deploy" section
5. You'll see two boxes to fill:
   - **First box** (`initialOwner`): Paste YOUR wallet address (from MetaMask)
   - **Second box** (`_liquidityPool`): Paste your liquidity pool address (from .env file: `NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS`)
6. Click orange "Deploy" button
7. MetaMask will pop up - click "Confirm" and pay gas fee

### Step 6: Get Your Contract Address
1. After deployment, you'll see your contract in "Deployed Contracts" section
2. Click the arrow to expand it
3. **COPY THE ADDRESS** (it starts with 0x...)
4. This is your NFT contract address! 🎉

### Step 7: Add to Your App
1. Open your `.env` file
2. Add this line:
   ```
   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xPASTE_YOUR_ADDRESS_HERE
   ```
3. Replace `0xPASTE_YOUR_ADDRESS_HERE` with the address you copied
4. Save the file
5. Restart your app

## DONE! 🎉

Now when users click "MINT NFT", it will mint to their wallet!

---

## Need Base Network in MetaMask?

If you don't have Base network:
1. Open MetaMask
2. Click network dropdown
3. Click "Add Network" or "Add a network manually"
4. Enter these details:
   - **Network Name**: Base
   - **RPC URL**: https://mainnet.base.org
   - **Chain ID**: 8453
   - **Currency Symbol**: ETH
   - **Block Explorer**: https://basescan.org
5. Click "Save"

---

## Testing First? (Recommended)

Before mainnet, test on Base Sepolia (testnet):
1. Get free testnet ETH: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
2. In MetaMask, switch to "Base Sepolia" network
3. Follow same steps above but use Sepolia network
4. Test minting - it's free!
5. If it works, switch back to Base mainnet and deploy for real

---

## That's It!

No coding needed. Just copy, paste, click buttons. Takes 5 minutes.

