'use client'

import { useEffect, useState } from 'react'

interface CSPViolation {
  blockedURI: string
  violatedDirective: string
  originalPolicy: string
  timestamp: number
}

export function useCSPMonitoring() {
  const [violations, setViolations] = useState<CSPViolation[]>([])

  useEffect(() => {
    const handleCSPViolation = (event: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        timestamp: Date.now()
      }
      
      console.warn('🚨 CSP Violation Detected:', {
        directive: violation.violatedDirective,
        blocked: violation.blockedURI,
        time: new Date(violation.timestamp).toISOString()
      })
      
      setViolations(prev => [...prev.slice(-9), violation]) // Keep last 10 violations
      
      // Auto-report critical violations
      if (violation.blockedURI.includes('walletconnect') || 
          violation.blockedURI.includes('explorer-api') ||
          violation.violatedDirective === 'connect-src') {
        console.log('🔄 Critical CSP violation detected, may affect wallet connectivity')
      }
    }

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', handleCSPViolation)
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation)
    }
  }, [])

  const clearViolations = () => {
    setViolations([])
  }

  const getViolationSummary = () => {
    const summary = violations.reduce((acc, violation) => {
      const key = violation.violatedDirective
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return summary
  }

  return {
    violations,
    clearViolations,
    getViolationSummary,
    violationCount: violations.length
  }
}

interface CSPMonitorProps {
  showDetails?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function CSPMonitor({ showDetails = false, position = 'bottom-right' }: CSPMonitorProps) {
  const { violations, clearViolations, getViolationSummary, violationCount } = useCSPMonitoring()
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development' || violationCount === 0) {
    return null
  }

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2'
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 text-xs bg-red-600 text-white p-2 rounded max-w-sm`}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold">🚨 CSP Issues</div>
        <button
          onClick={clearViolations}
          className="text-xs bg-red-700 px-1 py-0.5 rounded hover:bg-red-800"
        >
          Clear
        </button>
      </div>
      
      <div className="mb-2">
        {violationCount} violation{violationCount !== 1 ? 's' : ''} detected
      </div>
      
      {showDetails && violations.length > 0 && (
        <div className="max-h-32 overflow-y-auto bg-red-700 p-1 rounded">
          {violations.slice(-3).map((violation, index) => (
            <div key={index} className="text-xs mb-1">
              <div className="font-semibold">{violation.violatedDirective}</div>
              <div className="truncate text-red-200">{violation.blockedURI}</div>
            </div>
          ))}
        </div>
      )}
      
      {violationCount > 3 && (
        <div className="text-xs text-red-200 mt-1">
          Multiple violations may indicate CSP configuration issues
        </div>
      )}
    </div>
  )
}