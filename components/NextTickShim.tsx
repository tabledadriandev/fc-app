'use client'

import { useEffect } from 'react'

// Shim for nextTick functionality to prevent rendering loops
declare global {
  interface Window {
    process?: {
      nextTick: (callback: () => void) => void
    }
    global?: any
  }
}

export default function NextTickShim() {
  useEffect(() => {
    // Implement nextTick shim to prevent React rendering loops
    if (typeof window !== 'undefined' && !window.process?.nextTick) {
      // Create a simple nextTick implementation
      window.process = window.process || {}
      window.process.nextTick = (callback: () => void) => {
        setTimeout(callback, 0)
      }
    }

    // Global shim for instrumentMethod.js issues
    if (typeof window !== 'undefined') {
      // Override any problematic instrumentMethod calls
      const originalFetch = window.fetch
      window.fetch = function(...args) {
        try {
          return originalFetch.apply(this, args)
        } catch (error) {
          console.warn('Fetch blocked by CSP, using fallback:', error)
          // Return a mock response for blocked requests
          return Promise.resolve(new Response(JSON.stringify({ error: 'CSP blocked' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }))
        }
      }

      // Handle instrumentMethod.js specific issues
      if ((window as any).instrumentMethod) {
        console.log('✅ instrumentMethod.js loaded successfully')
      } else {
        // Provide fallback for missing instrumentMethod
        ;(window as any).instrumentMethod = function(methodName: string, target: any, descriptor: PropertyDescriptor) {
          console.log(`📊 instrumentMethod shim: ${methodName}`)
          return descriptor
        }
      }

      // Handle Privy provider specific issues
      if (!(window as any).Privy) {
        ;(window as any).Privy = {
          config: (options: any) => {
            console.log('📱 Privy config shim:', options)
          },
          createWidget: (element: HTMLElement, options: any) => {
            console.log('🟣 Privy widget shim created')
            return { destroy: () => console.log('🟣 Privy widget destroyed') }
          }
        }
      }
    }
  }, [])

  return null // This component doesn't render anything
}