import React, { useState } from 'react'
import { Mail, X, ExternalLink, AlertCircle } from 'lucide-react'

export function EmailSetupBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    return !localStorage.getItem('email-setup-dismissed')
  })

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('email-setup-dismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Email Notifications Setup Required
          </h3>
          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <p className="mb-2">
              To enable automatic email notifications when projects are updated, you need to:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Sign up for a <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Resend account</a></li>
              <li>Get your API key from the Resend dashboard</li>
              <li>Add <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">RESEND_API_KEY</code> to your Supabase environment variables</li>
              <li>Update the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">from</code> email address in the edge function</li>
            </ol>
            <div className="mt-3 flex items-center space-x-4">
              <a
                href="https://supabase.com/docs/guides/functions/secrets"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Supabase Secrets Guide
              </a>
              <a
                href="https://resend.com/docs/send-with-nodejs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Resend Documentation
              </a>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}