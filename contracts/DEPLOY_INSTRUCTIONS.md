# NFT Contract Deployment Instructions

## Prerequisites

1. **Install Foundry** (recommended) or use Remix IDE
   - Foundry: https://book.getfoundry.sh/getting-started/installation
   - Or use Remix: https://remix.ethereum.org

2. **Get Base Network RPC**
   - Mainnet: `https://mainnet.base.org`
   - Testnet (Base Sepolia): `https://sepolia.base.org`

3. **Get testnet ETH** (for testing)
   - Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## Option 1: Deploy with Foundry

### 1. Install OpenZeppelin Contracts

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
```

### 2. Create `.env` file

```bash
PRIVATE_KEY=your_private_key_here
LIQUIDITY_POOL_ADDRESS=0xYourLiquidityPoolAddress
RPC_URL=https://mainnet.base.org
```

### 3. Deploy Script

Create `scripts/DeployTANFT.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {TANFT} from "../contracts/TANFT.sol";

contract DeployTANFT is Script {
    function run() external returns (address) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address liquidityPool = vm.envAddress("LIQUIDITY_POOL_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        TANFT nft = new TANFT(msg.sender, liquidityPool);
        
        vm.stopBroadcast();
        
        console.log("TANFT deployed at:", address(nft));
        return address(nft);
    }
}
```

### 4. Deploy

```bash
# Testnet
forge script scripts/DeployTANFT.s.sol:DeployTANFT --rpc-url $RPC_URL --broadcast --verify

# Mainnet
forge script scripts/DeployTANFT.s.sol:DeployTANFT --rpc-url $RPC_URL --broadcast --verify --etherscan-api-key YOUR_ETHERSCAN_API_KEY
```

## Option 2: Deploy with Remix IDE

1. Go to https://remix.ethereum.org
2. Create new file `TANFT.sol`
3. Copy the contract code
4. Install OpenZeppelin contracts:
   - Click "File Explorer" → "contracts"
   - Right-click → "New File" → name it `@openzeppelin/contracts/package.json`
   - Or use: `npm install @openzeppelin/contracts` in Remix terminal
5. Compile the contract
6. Deploy:
   - Select "Injected Provider" (MetaMask)
   - Set constructor parameters:
     - `initialOwner`: Your wallet address
     - `_liquidityPool`: Your liquidity pool address
   - Click "Deploy"
7. Copy the deployed contract address

## After Deployment

1. **Copy the contract address** from deployment
2. **Add to your `.env` file**:
   ```
   NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```
3. **Verify on BaseScan** (optional but recommended):
   - Go to https://basescan.org
   - Find your contract
   - Click "Contract" → "Verify and Publish"
   - Paste your contract code

## Contract Functions

- `mint(address to, string tokenURI)` - Mints NFT to address (payable, 0.003 ETH)
- `setLiquidityPool(address)` - Owner can update liquidity pool
- `currentTokenId()` - Get next token ID
- `totalSupply()` - Get total minted count

## Important Notes

- **Max Supply**: 1,000 NFTs
- **Mint Price**: 0.003 ETH (fixed)
- **Payment**: Automatically sent to liquidity pool on mint
- **Owner**: Can update liquidity pool address if needed

## Testing

Before mainnet, test on Base Sepolia:

1. Deploy to Base Sepolia testnet
2. Test minting with testnet ETH
3. Verify NFT appears in wallet
4. Check liquidity pool receives payment
5. Then deploy to mainnet

