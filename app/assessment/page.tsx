'use client'

import { useState } from 'react'
import AssessmentForm from '@/components/AssessmentForm'

export default function AssessmentPage() {
  const [walletAddress, setWalletAddress] = useState<string>('')

  // Get wallet from query params
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const wallet = params.get('wallet')
    if (wallet && !walletAddress) {
      setWalletAddress(wallet)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Table d'Adrian
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Personalized Wellness Assessment
          </p>
          <AssessmentForm walletAddress={walletAddress} />
        </div>
      </div>
    </div>
  )
}

