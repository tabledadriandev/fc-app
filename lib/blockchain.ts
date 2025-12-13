import { createPublicClient, http, formatUnits } from 'viem'
import {
  DESCI_CHAIN,
  RPC_URL,
  TABLEDADRIAN_TOKEN_ADDRESS,
  TABLEDADRIAN_TOKEN_DECIMALS,
  WHITELIST_CONTRACT_ADDRESS,
} from './config'

// Minimal ERC‑20 ABI (balanceOf)
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Minimal whitelist contract ABI used by the front‑end.
// See `contracts/Whitelist.sol` for the on‑chain implementation.
export const WHITELIST_ABI = [
  {
    name: 'joinWhitelist',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'whitelisted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const

// TANFT contract ABI for minting NFTs
export const TANFT_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenURI', type: 'string' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const

const publicClient = createPublicClient({
  chain: DESCI_CHAIN,
  transport: http(RPC_URL),
})

/**
 * Get user's $tabledadrian token balance (raw bigint).
 */
export async function getTokenBalance(walletAddress: string): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: TABLEDADRIAN_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    })
    return balance as bigint
  } catch (error) {
    console.error('Error fetching token balance:', error)
    return 0n
  }
}

/**
 * Convenience helper to format a raw token amount for display.
 */
export function formatTokenAmount(amount: bigint): string {
  return formatUnits(amount, TABLEDADRIAN_TOKEN_DECIMALS)
}

/**
 * Optional helper to check if a user is already whitelisted on‑chain.
 * Requires `NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS` and a deployed contract
 * compatible with `contracts/Whitelist.sol`.
 */
export async function isAddressWhitelisted(address: string): Promise<boolean> {
  if (!WHITELIST_CONTRACT_ADDRESS) {
    // No contract configured – treat as not whitelisted but log for operators.
    console.warn('WHITELIST_CONTRACT_ADDRESS is not set. Skipping on‑chain whitelist check.')
    return false
  }

  try {
    const result = await publicClient.readContract({
      address: WHITELIST_CONTRACT_ADDRESS,
      abi: WHITELIST_ABI,
      functionName: 'whitelisted',
      args: [address as `0x${string}`],
    })
    return Boolean(result)
  } catch (err) {
    console.error('Error checking whitelist status:', err)
    return false
  }
}

