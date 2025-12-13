'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Check for CSP-related errors
    if (error.message.includes('Content Security Policy') || 
        error.message.includes('CSP') ||
        error.message.includes('walletconnect')) {
      console.warn('CSP-related error detected, providing fallback UI')
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-white p-4 flex items-center justify-center">
          <div className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
            <div className="text-xl font-black text-center mb-4 text-red-600">Application Error</div>
            <div className="text-sm text-center mb-4 text-gray-600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>
            
            {this.state.error?.message?.includes('Content Security Policy') && (
              <div className="text-xs text-center mb-4 text-orange-600 bg-orange-50 p-3 border-2 border-orange-200">
                <div className="font-bold mb-1">Security Policy Notice</div>
                <div>
                  Some features may be limited due to browser security settings. 
                  The application will use alternative methods.
                </div>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white border-2 border-black p-3 font-black hover:bg-white hover:text-black transition-all"
            >
              Reload Application
            </button>
            
            <div className="text-xs text-center mt-4 text-gray-500">
              If problems persist, try refreshing or contact support.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}