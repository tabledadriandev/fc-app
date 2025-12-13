'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useWalletClient, usePublicClient } from 'wagmi'
import { injected } from 'wagmi/connectors'

interface WalletProviderProps {
  children: React.ReactNode
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [isClient, setIsClient] = useState(false)
  const [walletReady, setWalletReady] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true)
    
    // Check if WalletConnect is available
    const checkWalletConnect = async () => {
      try {
        // Test WalletConnect API accessibility
        const testResponse = await fetch('https://explorer-api.walletconnect.com/health', {
          method: 'GET',
          mode: 'cors',
        })
        
        if (testResponse.ok) {
          console.log('✅ WalletConnect API accessible')
          setWalletReady(true)
        } else {
          console.warn('⚠️ WalletConnect API not accessible, using fallback')
          setWalletReady(true) // Still allow fallback to work
        }
      } catch (error) {
        console.warn('⚠️ WalletConnect API check failed, using fallback:', error)
        setWalletReady(true) // Still allow fallback to work
      }
    }

    checkWalletConnect()
  }, [])

  // Error boundary for wallet operations
  const handleWalletError = (error: any) => {
    console.error('Wallet operation failed:', error)
    
    // Check for CSP-related errors
    if (error?.message?.includes('Content Security Policy') || 
        error?.message?.includes('CSP') ||
        error?.message?.includes('walletconnect')) {
      setConnectionError('Wallet connection blocked by security policy. Using Farcaster wallet fallback.')
    } else if (error?.code === 4001) {
      setConnectionError('Wallet connection was rejected. Please try again.')
    } else {
      setConnectionError('Wallet connection failed. Using Farcaster wallet fallback.')
    }
  }

  // Auto-connect if not connected (with error handling)
  useEffect(() => {
    if (isClient && !isConnected && walletReady) {
      try {
        // Only attempt auto-connect if we're in a secure context
        if (typeof window !== 'undefined' && window.isSecureContext) {
          connect({ connector: injected() })
        }
      } catch (error) {
        handleWalletError(error)
      }
    }
  }, [isClient, isConnected, walletReady, connect])

  // Show loading state during client hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xl font-black text-center">Initializing Wallet...</div>
        </div>
      </div>
    )
  }

  // Show error state if wallet initialization failed
  if (connectionError) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <div className="text-xl font-black text-center mb-4 text-orange-600">Wallet Setup</div>
          <div className="text-sm text-center mb-4 text-gray-600">
            {connectionError}
          </div>
          <div className="text-xs text-center text-gray-500">
            The application will use Farcaster wallet for blockchain operations.
          </div>
          <button
            onClick={() => {
              setConnectionError(null)
              setWalletReady(true)
            }}
            className="w-full mt-4 bg-black text-white border-2 border-black p-3 font-black hover:bg-white hover:text-black transition-all"
          >
            Continue with Farcaster Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* CSP-compliant wallet status indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 right-2 z-50 text-xs bg-black text-white p-2 rounded">
          {walletReady ? '✅ Wallet Ready' : '⏳ Initializing...'}
          {isConnected && <div>🔗 Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</div>}
        </div>
      )}
      
      {children}
    </div>
  )
}