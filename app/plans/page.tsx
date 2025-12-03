'use client'

import { useState, useEffect } from 'react'

interface Assessment {
  id: string
  goal: string
  pdf_url: string | null
  created_at: string
  pdf_expires_at: string | null
  downloaded_at: string | null
}

export default function PlansPage() {
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get wallet from query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const wallet = params.get('wallet')
      if (wallet) {
        setWalletAddress(wallet)
        fetchAssessments(wallet)
      } else {
        setError('No wallet address provided')
        setLoading(false)
      }
    }
  }, [])

  const fetchAssessments = async (wallet: string) => {
    try {
      const response = await fetch(`/api/user-assessments?walletAddress=${wallet}`)
      if (!response.ok) {
        throw new Error('Failed to fetch assessments')
      }
      const data = await response.json()
      setAssessments(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (expiresAt: string | null): boolean => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your plans...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Table d'Adrian
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Your Wellness Plans
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No wellness plans yet.</p>
              <a
                href={`/assessment?wallet=${walletAddress}`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Create Your First Plan
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {assessment.goal}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(assessment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isExpired(assessment.pdf_expires_at) ? (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        Expired
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        Active
                      </span>
                    )}
                  </div>

                  {assessment.pdf_url && !isExpired(assessment.pdf_expires_at) ? (
                    <a
                      href={assessment.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      Download PDF
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500">
                      This plan has expired. Create a new assessment to generate a new plan.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <a
              href={`/assessment?wallet=${walletAddress}`}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create New Assessment →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

