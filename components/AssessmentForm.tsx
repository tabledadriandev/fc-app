'use client'

import { useState } from 'react'

interface AssessmentFormProps {
  walletAddress: string
}

export default function AssessmentForm({ walletAddress }: AssessmentFormProps) {
  const [formData, setFormData] = useState({
    goal: '',
    challenges: '',
    lifestyle: '',
    dietary: '',
    conditions: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // First, get or create user
      const userResponse = await fetch('/api/get-or-create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      })

      if (!userResponse.ok) {
        throw new Error('Failed to create user')
      }

      const { userId } = await userResponse.json()

      // Create assessment
      const assessmentResponse = await fetch('/api/create-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          assessment: formData,
        }),
      })

      if (!assessmentResponse.ok) {
        throw new Error('Failed to create assessment')
      }

      const { assessmentId } = await assessmentResponse.json()

      // Generate PDF
      const pdfResponse = await fetch('/api/generate-wellness-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: assessmentId,
          assessment: formData,
        }),
      })

      if (!pdfResponse.ok) {
        throw new Error('Failed to generate PDF')
      }

      const { pdfUrl: url, expiresAt } = await pdfResponse.json()
      setPdfUrl(url)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success && pdfUrl) {
    return (
      <div className="text-center">
        <div className="mb-6">
          <svg
            className="mx-auto h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4">Your Wellness Plan is Ready!</h2>
        <p className="text-gray-600 mb-6">
          Your personalized PDF has been generated and is available for 24 hours.
        </p>
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Download PDF
        </a>
        <p className="text-sm text-gray-500 mt-4">
          This link expires in 24 hours. Keep it private.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What's your main wellness goal? <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          maxLength={150}
          value={formData.goal}
          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Lower DHEA, Increase energy, Better sleep, Gut healing"
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.goal.length}/150 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What are your current challenges? <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          maxLength={200}
          value={formData.challenges}
          onChange={(e) =>
            setFormData({ ...formData, challenges: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., High stress, fatigue, Irregular sleep, Digestive issues"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.challenges.length}/200 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your current lifestyle: <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.lifestyle}
          onChange={(e) =>
            setFormData({ ...formData, lifestyle: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select your lifestyle</option>
          <option value="Sedentary">Sedentary</option>
          <option value="Moderate activity (exercise 2-3x/week)">
            Moderate activity (exercise 2-3x/week)
          </option>
          <option value="Very active (exercise 5+ times/week)">
            Very active (exercise 5+ times/week)
          </option>
          <option value="Athlete">Athlete</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dietary preferences/restrictions: <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          maxLength={150}
          value={formData.dietary}
          onChange={(e) =>
            setFormData({ ...formData, dietary: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Vegan, no gluten, Keto, Carnivore, Allergic to seafood"
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.dietary.length}/150 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Any health conditions we should know?
        </label>
        <textarea
          maxLength={200}
          value={formData.conditions}
          onChange={(e) =>
            setFormData({ ...formData, conditions: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., PCOS, Hypothyroidism, IBS, History of autoimmune"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.conditions.length}/200 characters
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Generating Your Plan...' : 'Generate My Wellness Plan'}
      </button>
    </form>
  )
}

