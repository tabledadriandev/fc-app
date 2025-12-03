import { createPublicClient, http, formatUnits } from 'viem'
import { base } from 'viem/chains'

const TA_TOKEN_ADDRESS = process.env.TA_TOKEN_ADDRESS || '0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07'
const TA_TOKEN_DECIMALS = 18
const MIN_ELIGIBILITY = 5_000_000n * 10n ** BigInt(TA_TOKEN_DECIMALS) // 5M tokens
const HOLDER_BONUS_THRESHOLD = 10_000_000n * 10n ** BigInt(TA_TOKEN_DECIMALS) // 10M tokens

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
] as const

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
})

/**
 * Get user's $tabledadrian token balance
 */
export async function getTokenBalance(walletAddress: string): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: TA_TOKEN_ADDRESS as `0x${string}`,
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
 * Check if user is eligible (holds 5M+ tokens)
 */
export async function checkEligibility(walletAddress: string): Promise<{
  eligible: boolean
  balance: string
  balanceRaw: bigint
  message: string
}> {
  const balance = await getTokenBalance(walletAddress)
  const balanceFormatted = formatUnits(balance, TA_TOKEN_DECIMALS)
  const eligible = balance >= MIN_ELIGIBILITY

  return {
    eligible,
    balance: balanceFormatted,
    balanceRaw: balance,
    message: eligible
      ? `Welcome! You hold ${parseFloat(balanceFormatted).toLocaleString()} $tabledadrian`
      : `Hold 5M $tabledadrian to access Table d'Adrian's AI Wellness Plans`,
  }
}

/**
 * Check if user qualifies for holder bonus (10M+ tokens)
 */
export async function checkHolderBonus(walletAddress: string): Promise<boolean> {
  const balance = await getTokenBalance(walletAddress)
  return balance >= HOLDER_BONUS_THRESHOLD
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: bigint): string {
  return formatUnits(amount, TA_TOKEN_DECIMALS)
}

