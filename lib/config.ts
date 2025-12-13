import { base } from 'viem/chains'

/**
 * Core blockchain + token configuration for the DeSci whitelist dApp.
 *
 * NOTE:
 * - Update the chain or contract addresses here if you deploy to a different network.
 * - Do NOT hard‑code secrets; use environment variables instead.
 */

// Target chain for the dApp (Base mainnet by default)
export const DESCI_CHAIN = base

// RPC URL used by both viem and wagmi (can be overridden in `.env.local`)
export const RPC_URL =
  process.env.NEXT_PUBLIC_BASE_RPC_URL || process.env.BASE_RPC_URL || 'https://mainnet.base.org'

/**
 * $tabledadrian ERC‑20 token configuration.
 *
 * CONTRACT ADDRESS:
 * - This is currently pointing at the existing Table d'Adrian token on Base.
 * - If you migrate or redeploy, set `NEXT_PUBLIC_TABLEDADRIAN_TOKEN_ADDRESS` in `.env.local`.
 */
export const TABLEDADRIAN_TOKEN_ADDRESS =
  (process.env.NEXT_PUBLIC_TABLEDADRIAN_TOKEN_ADDRESS as `0x${string}` | undefined) ??
  // TODO: Confirm this is the correct production $tabledadrian contract on Base
  ('0xee47670a6ed7501aeeb9733efd0bf7d93ed3cb07' as `0x${string}`)

export const TABLEDADRIAN_TOKEN_DECIMALS =
  Number(process.env.NEXT_PUBLIC_TABLEDADRIAN_TOKEN_DECIMALS || process.env.TA_TOKEN_DECIMALS) ||
  18

// Minimum required value in EUR to join the whitelist
export const MIN_EUR_VALUE_REQUIREMENT = 1 // 1 EUR worth of $tabledadrian

/**
 * Whitelist contract configuration.
 *
 * - Deploy `contracts/Whitelist.sol` and set the deployed address here via env:
 *   NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS=0x...
 */
export const WHITELIST_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_WHITELIST_CONTRACT_ADDRESS as `0x${string}` | undefined

export const TANFT_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_TANFT_CONTRACT_ADDRESS as `0x${string}` | undefined


