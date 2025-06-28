import React, { useState, useEffect } from 'react'
import { useContext } from 'react'
import { ShopContext } from '@/context/ShopContext'
import axios from 'axios'
import { toast } from 'sonner'

const TermsAndConditions = () => {
  const { backendUrl } = useContext(ShopContext)
  const [termsAndConditions, setTermsAndConditions] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTermsAndConditions = async () => {
      try {
        setIsLoading(true)
        const response = await axios.get(`${backendUrl}/api/settings/legal`)
        if (response.data.success) {
          setTermsAndConditions(response.data.legal.termsAndConditions)
        }
      } catch (error) {
        console.error('Error fetching terms and conditions:', error)
        toast.error('Failed to load terms and conditions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTermsAndConditions()
  }, [backendUrl])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            {termsAndConditions ? (
              <div className="space-y-4">
                {termsAndConditions.split('\n').map((paragraph, index) => (
                  paragraph.trim() && (
                    <p key={index} className="text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Terms and Conditions Not Available</h3>
                <p className="text-gray-500">
                  The terms and conditions are currently being updated. Please check back later.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                If you have any questions about these Terms and Conditions, please contact us.
              </p>
              <button
                onClick={() => window.history.back()}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions
