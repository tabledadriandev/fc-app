'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useWalletClient, usePublicClient } from 'wagmi'
import { injected } from 'wagmi/connectors'

interface WalletProviderProps {
  children: React.ReactNode
}

interface CSPViolation {
  blockedURI: string
  violatedDirective: string
  originalPolicy: string
  timestamp: number
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [isClient, setIsClient] = useState(false)
  const [walletReady, setWalletReady] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [cspViolations, setCspViolations] = useState<CSPViolation[]>([])
  const [walletConnectStatus, setWalletConnectStatus] = useState<'checking' | 'ready' | 'fallback'>('checking')
  
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  // CSP Violation Monitoring
  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        timestamp: Date.now()
      }
      
      console.warn('🚨 CSP Violation Detected:', violation)
      setCspViolations(prev => [...prev.slice(-4), violation]) // Keep last 5 violations
      
      // Auto-retry for WalletConnect violations
      if (violation.blockedURI.includes('walletconnect') || violation.blockedURI.includes('explorer-api')) {
        console.log('🔄 WalletConnect CSP violation detected, retrying connection...')
        setTimeout(() => {
          setWalletConnectStatus('fallback')
          setWalletReady(true)
        }, 2000)
      }
    }

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', handleCSPViolation)
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation)
    }
  }, [])

  // Enhanced WalletConnect connectivity check
  useEffect(() => {
    const checkWalletConnectivity = async () => {
      setWalletConnectStatus('checking')
      
      try {
        // Test multiple WalletConnect endpoints
        const endpoints = [
          'https://explorer-api.walletconnect.com/health',
          'https://explorer-api.walletconnect.com/v2/wallets',
          'https://registry.walletconnect.com'
        ]
        
        let connected = false
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache'
            })
            
            if (response.ok) {
              console.log(`✅ WalletConnect endpoint accessible: ${endpoint}`)
              connected = true
              break
            }
          } catch (error) {
            console.warn(`⚠️ WalletConnect endpoint failed: ${endpoint}`, error)
          }
        }
        
        if (connected) {
          setWalletConnectStatus('ready')
          setWalletReady(true)
        } else {
          throw new Error('All WalletConnect endpoints failed')
        }
        
      } catch (error) {
        console.warn('⚠️ WalletConnect connectivity check failed:', error)
        setWalletConnectStatus('fallback')
        setWalletReady(true) // Enable Farcaster wallet fallback
      }
    }

    if (isClient) {
      checkWalletConnectivity()
    }
  }, [isClient])

  // Enhanced error handling with CSP awareness
  const handleWalletError = (error: any) => {
    console.error('💥 Wallet operation failed:', error)
    
    let errorMessage = 'Wallet connection failed'
    let shouldRetry = true
    
    // CSP-related errors
    if (error?.message?.includes('Content Security Policy') ||
        error?.message?.includes('CSP') ||
        error?.message?.includes('blocked') ||
        error?.message?.includes('walletconnect')) {
      errorMessage = 'Security policy blocked wallet connection. Using Farcaster wallet fallback.'
      shouldRetry = false
    }
    // User rejection
    else if (error?.code === 4001 || error?.message?.includes('rejected')) {
      errorMessage = 'Wallet connection was rejected by user.'
      shouldRetry = true
    }
    // Network errors
    else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      errorMessage = 'Network error. Check your connection and try again.'
      shouldRetry = true
    }
    // Unknown errors
    else {
      errorMessage = 'Wallet connection failed. Using Farcaster wallet fallback.'
      shouldRetry = false
    }
    
    setConnectionError(errorMessage)
    
    // Auto-retry after delay for retryable errors
    if (shouldRetry) {
      setTimeout(() => {
        setConnectionError(null)
        setWalletReady(true)
      }, 3000)
    }
  }

  // Safe auto-connect with error boundaries
  useEffect(() => {
    if (isClient && !isConnected && walletReady && walletConnectStatus !== 'checking') {
      try {
        // Only attempt auto-connect in secure contexts
        if (typeof window !== 'undefined' && window.isSecureContext && walletConnectStatus === 'ready') {
          connect({ connector: injected() })
        } else if (walletConnectStatus === 'fallback') {
          console.log('🔄 Using Farcaster wallet fallback - no auto-connect needed')
        }
      } catch (error) {
        handleWalletError(error)
      }
    }
  }, [isClient, isConnected, walletReady, walletConnectStatus, connect])

  // Initialize client-side only
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Show loading state during client hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-xl font-black text-center">Initializing Wallet...</div>
          <div className="text-sm text-center mt-2 text-gray-600">
            Setting up secure blockchain connection
          </div>
        </div>
      </div>
    )
  }

  // Show error state with retry options
  if (connectionError) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <div className="text-xl font-black text-center mb-4 text-orange-600">Wallet Setup</div>
          <div className="text-sm text-center mb-4 text-gray-600">
            {connectionError}
          </div>
          
          {/* Show CSP violations in development */}
          {cspViolations.length > 0 && process.env.NODE_ENV === 'development' && (
            <div className="text-xs bg-red-100 p-2 rounded mb-4 max-h-20 overflow-y-auto">
              <div className="font-bold">CSP Violations:</div>
              {cspViolations.map((violation, index) => (
                <div key={index} className="truncate">
                  {violation.violatedDirective}: {violation.blockedURI}
                </div>
              ))}
            </div>
          )}
          
          <div className="text-xs text-center text-gray-500 mb-4">
            The application will use Farcaster wallet for blockchain operations.
          </div>
          <button
            onClick={() => {
              setConnectionError(null)
              setWalletReady(true)
              setWalletConnectStatus('fallback')
            }}
            className="w-full mt-4 bg-black text-white border-2 border-black p-3 font-black hover:bg-white hover:text-black transition-all"
          >
            Continue with Farcaster Wallet
          </button>
          <button
            onClick={() => {
              setConnectionError(null)
              setCspViolations([])
              window.location.reload()
            }}
            className="w-full mt-2 bg-gray-200 text-black border-2 border-black p-2 font-bold hover:bg-gray-300 transition-all text-sm"
          >
            Retry Wallet Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Enhanced development status indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-2 right-2 z-50 text-xs bg-black text-white p-2 rounded max-w-xs">
          <div className="flex items-center gap-1">
            {walletConnectStatus === 'ready' ? '✅' : '🔄'}
            <span>
              {walletConnectStatus === 'ready' ? 'WalletConnect Ready' : 'Farcaster Wallet'}
            </span>
          </div>
          {isConnected && (
            <div className="mt-1">
              🔗 {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          )}
          {cspViolations.length > 0 && (
            <div className="mt-1 text-yellow-300">
              ⚠️ {cspViolations.length} CSP violations
            </div>
          )}
        </div>
      )}
      
      {children}
    </div>
  )
}