import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  clientName: string
  projectName: string
  updateType: 'status' | 'progress' | 'general'
  oldValue?: string
  newValue?: string
  message?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, clientName, projectName, updateType, oldValue, newValue, message }: EmailRequest = await req.json()

    // Get Resend API key from environment
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    // Generate email content based on update type
    let subject = ''
    let htmlContent = ''

    switch (updateType) {
      case 'status':
        subject = `Project Status Update: ${projectName}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Project Status Update</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${clientName},</p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                Great news! We've updated the status of your project <strong>"${projectName}"</strong>.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Status changed from:</p>
                <p style="margin: 5px 0; font-size: 16px; color: #dc3545;">${oldValue?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p style="margin: 0; color: #666; font-size: 14px;">to:</p>
                <p style="margin: 5px 0; font-size: 16px; color: #28a745; font-weight: bold;">${newValue?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
              </div>
              
              ${message ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #1565c0; font-style: italic;">"${message}"</p>
                </div>
              ` : ''}
              
              <p style="font-size: 16px; color: #333; margin: 20px 0;">
                You can view the full project details and progress in your client dashboard.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Project Dashboard
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666; margin: 0;">
                Best regards,<br>
                Your Project Team
              </p>
            </div>
          </div>
        `
        break

      case 'progress':
        subject = `Project Progress Update: ${projectName}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Project Progress Update</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${clientName},</p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                We've made progress on your project <strong>"${projectName}"</strong>!
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
                <p style="margin: 0; color: #666; font-size: 14px;">Progress updated from:</p>
                <p style="margin: 5px 0; font-size: 16px; color: #666;">${oldValue}%</p>
                <p style="margin: 0; color: #666; font-size: 14px;">to:</p>
                <p style="margin: 5px 0; font-size: 18px; color: #28a745; font-weight: bold;">${newValue}%</p>
              </div>
              
              <div style="background: #e8f5e8; border-radius: 10px; padding: 4px; margin: 20px 0;">
                <div style="background: #28a745; height: 20px; border-radius: 6px; width: ${newValue}%; transition: width 0.3s ease;"></div>
              </div>
              
              ${message ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #1565c0; font-style: italic;">"${message}"</p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Project Dashboard
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666; margin: 0;">
                Best regards,<br>
                Your Project Team
              </p>
            </div>
          </div>
        `
        break

      default:
        subject = `Project Update: ${projectName}`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Project Update</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${clientName},</p>
              
              <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                We have an update regarding your project <strong>"${projectName}"</strong>.
              </p>
              
              ${message ? `
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <p style="margin: 0; color: #333; font-size: 16px;">${message}</p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('SITE_URL') || 'https://your-app.com'}/dashboard" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Project Dashboard
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #666; margin: 0;">
                Best regards,<br>
                Your Project Team
              </p>
            </div>
          </div>
        `
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      throw new Error(`Failed to send email: ${errorData}`)
    }

    const result = await emailResponse.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})