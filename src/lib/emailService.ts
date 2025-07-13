import { supabase } from './supabase'

interface EmailNotificationData {
  clientEmail: string
  clientName: string
  projectName: string
  updateType: 'status' | 'progress' | 'general'
  oldValue?: string
  newValue?: string
  message?: string
}

export async function sendProjectUpdateEmail(data: EmailNotificationData) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-project-update-email`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.clientEmail,
          clientName: data.clientName,
          projectName: data.projectName,
          updateType: data.updateType,
          oldValue: data.oldValue,
          newValue: data.newValue,
          message: data.message,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to send email')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error sending project update email:', error)
    throw error
  }
}

// Helper function to format status for display
export function formatStatusForEmail(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}