'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

// Global configuration for Farcaster API endpoints
declare global {
  interface Window {
    __FARCASTER_CONFIG__?: {
      baseApiUrl: string
      registryProxyAddress: string
      enableWalletConnect: boolean
    }
    Privy?: {
      config: (options: any) => void
    }
  }
}

interface FarcasterConfigProviderProps {
  children: React.ReactNode
}

export default function FarcasterConfigProvider({ children }: FarcasterConfigProviderProps) {
  const [isClient, setIsClient] = useState(false)
  const [config, setConfig] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
    
    // Configure Farcaster API endpoints
    const farcasterConfig = {
      baseApiUrl: 'https://client.warpcast.com', // Primary endpoint
      registryProxyAddress: '0x1234567890123456789012345678901234567890', // Registry proxy
      enableWalletConnect: true,
      nextTickShim: true, // Enable nextTick functionality
    }

    // Store configuration globally
    window.__FARCASTER_CONFIG__ = farcasterConfig

    // Set up API configuration for different environments
    const setupApiConfig = async () => {
      try {
        // Test connectivity to Farcaster endpoints
        const testUrls = [
          'https://client.warpcast.com/health',
          'https://client.farcaster.xyz/health',
        ]

        for (const url of testUrls) {
          try {
            const response = await fetch(url, { method: 'HEAD' })
            if (response.ok) {
              console.log(`✅ Connected to Farcaster API: ${url}`)
              break
            }
          } catch (err) {
            console.warn(`⚠️ Failed to connect to: ${url}`)
          }
        }

        setConfig(farcasterConfig)
      } catch (err) {
        console.error('Farcaster config setup failed:', err)
        setError('Failed to initialize Farcaster configuration')
      }
    }

    setupApiConfig()
  }, [])

  // Handle Privy provider integration issues
  useEffect(() => {
    if (isClient && window.Privy) {
      // Configure Privy with proper CSP-compliant settings
      try {
        window.Privy.config({
          appearance: {
            theme: 'light',
            accentColor: '#676BBF',
          },
          embedded: {
            origin: window.location.origin,
          },
          // CSP-compliant configuration
          strict: false, // Allow for development
          logger: {
            level: 'warn',
          },
        })
      } catch (err) {
        console.warn('Privy configuration failed:', err)
      }
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xl font-black text-center">Initializing Farcaster...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <div className="text-xl font-black text-center mb-4 text-red-600">Configuration Error</div>
          <div className="text-sm text-center text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-black text-white border-2 border-black p-3 font-black hover:bg-white hover:text-black transition-all"
          >
            Retry Configuration
          </button>
        </div>
      </div>
    )
  }

  return (
    <div data-farcaster-config="enabled">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && config && (
        <div className="fixed top-2 left-2 z-50 text-xs bg-blue-600 text-white p-2 rounded">
          <div>🔧 Farcaster Config</div>
          <div>API: {config.baseApiUrl}</div>
          <div>Registry: {config.registryProxyAddress.slice(0, 8)}...</div>
        </div>
      )}
      
      {children}
    </div>
  )
}

// Utility function to get current Farcaster configuration
export function getFarcasterConfig() {
  if (typeof window !== 'undefined' && window.__FARCASTER_CONFIG__) {
    return window.__FARCASTER_CONFIG__
  }
  return {
    baseApiUrl: 'https://client.warpcast.com',
    registryProxyAddress: '0x1234567890123456789012345678901234567890',
    enableWalletConnect: true,
  }
}