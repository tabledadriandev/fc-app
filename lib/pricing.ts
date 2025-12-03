import { formatUnits } from 'viem'
import { TABLEDADRIAN_TOKEN_DECIMALS, MIN_EUR_VALUE_REQUIREMENT } from './config'

/**
 * Small utility layer for token EUR pricing.
 *
 * You can swap this implementation to:
 * - Pull from a price oracle (e.g. Chainlink),
 * - Use a dedicated DEX/AMM price endpoint,
 * - Or hard‑code a price for gated communities.
 */

// Basic Coingecko fallback – currently uses the underlying chain token (ETH on Base) as proxy.
// Replace `coingeckoId` with the actual token once $tabledadrian has a listed feed.
const DEFAULT_COINGECKO_ID = 'ethereum'

export async function fetchTokenEurPrice(): Promise<number> {
  // Preferred: explicit override from env for full control.
  const manualPrice = process.env.NEXT_PUBLIC_TABLEDADRIAN_EUR_PRICE
  if (manualPrice) {
    const parsed = Number(manualPrice)
    if (!Number.isNaN(parsed) && parsed > 0) return parsed
  }

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${DEFAULT_COINGECKO_ID}&vs_currencies=eur`
    )
    if (!res.ok) throw new Error('Price API failed')
    const data = (await res.json()) as Record<string, { eur: number }>
    const price = data[DEFAULT_COINGECKO_ID]?.eur
    if (!price || price <= 0) throw new Error('Invalid price data')
    return price
  } catch (err) {
    console.error('Error fetching EUR price for token:', err)
    // Fallback to 0 so eligibility check clearly fails rather than over‑granting access
    return 0
  }
}

export async function computeBalanceEurValue(balanceRaw: bigint): Promise<{
  eurValue: number
  tokenAmount: string
  meetsRequirement: boolean
}> {
  const tokenAmount = formatUnits(balanceRaw, TABLEDADRIAN_TOKEN_DECIMALS)
  const price = await fetchTokenEurPrice()
  const eurValue = Number(tokenAmount) * price

  return {
    eurValue,
    tokenAmount,
    meetsRequirement: eurValue >= MIN_EUR_VALUE_REQUIREMENT,
  }
}


