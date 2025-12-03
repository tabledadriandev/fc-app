'use client'

import { ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base } from 'viem/chains'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Central wagmi config for the dApp
// RPC URL is configurable via NEXT_PUBLIC_BASE_RPC_URL
const config = createConfig({
  chains: [base],
  connectors: [injected()],
  transports: {
    [base.id]: http(
      process.env.NEXT_PUBLIC_BASE_RPC_URL || process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    ),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}


