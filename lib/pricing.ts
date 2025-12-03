import { formatUnits } from 'viem'
import { TABLEDADRIAN_TOKEN_DECIMALS, MIN_EUR_VALUE_REQUIREMENT } from './config'

/**
 * Small utility layer for token EUR pricing.
 *
 * Current data source:
 * - GeckoTerminal Base pool:
 *   https://www.geckoterminal.com/base/pools/0xa421606ad7907968228c58d56f20ab1028db588cedb3ece882e9c55515346d7d
 */

const GECKO_TERMINAL_POOL_URL =
  'https://api.geckoterminal.com/api/v2/networks/base/pools/0xa421606ad7907968228c58d56f20ab1028db588cedb3ece882e9c55515346d7d'

export async function fetchTokenEurPrice(): Promise<number> {
  // 1) Preferred: explicit manual override (lets you pin or smooth price if needed)
  const manualPrice = process.env.NEXT_PUBLIC_TABLEDADRIAN_EUR_PRICE
  if (manualPrice) {
    const parsed = Number(manualPrice)
    if (!Number.isNaN(parsed) && parsed > 0) return parsed
  }

  // 2) Live price from GeckoTerminal
  try {
    const res = await fetch(GECKO_TERMINAL_POOL_URL, {
      // Helpful for debugging in GeckoTerminal logs if needed
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 }, // cache for 30s on server to avoid rate limits
    })

    if (!res.ok) throw new Error(`GeckoTerminal API failed: ${res.status}`)

    const json = (await res.json()) as any

    // GeckoTerminal pool payload structure:
    // {
    //   data: {
    //     attributes: {
    //       base_token_price_usd: "0.000123",
    //       quote_token_price_usd: "...",
    //       // ...
    //     }
    //   }
    // }
    const usdStr: string | undefined =
      json?.data?.attributes?.base_token_price_usd ??
      json?.data?.attributes?.price_in_usd // fallback if schema changes

    const usd = usdStr ? Number(usdStr) : NaN
    if (!usd || Number.isNaN(usd) || usd <= 0) {
      throw new Error('Invalid USD price data from GeckoTerminal')
    }

    // Use a simple FX estimate for EUR (or plug in a dedicated FX feed later)
    const usdToEur = 0.92 // approximate; adjust if you want closer parity
    const eur = usd * usdToEur

    return eur
  } catch (err) {
    console.error('Error fetching EUR price for token from GeckoTerminal:', err)
    // 3) Fallback to 0 so eligibility check clearly fails rather than over‑granting access
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


