// Supabase Edge Function to send WhatsApp messages via Twilio
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_WHATSAPP_NUMBER = Deno.env.get('TWILIO_WHATSAPP_NUMBER') // Format: whatsapp:+14155238886
const GROUP_WHATSAPP_NUMBER = Deno.env.get('GROUP_WHATSAPP_NUMBER') // Your group WhatsApp number

serve(async (req) => {
  try {
    const { playerName, points, action } = await req.json()

    if (!playerName || !points || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create message
    const message = `🎯 MILESTONE REACHED! 🎯\n\n${playerName} just reached ${points} points!\n\nConsequence: ${action}\n\nTime to pay up! 🍻`

    // Send WhatsApp message via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const formData = new URLSearchParams({
      From: TWILIO_WHATSAPP_NUMBER!,
      To: GROUP_WHATSAPP_NUMBER!,
      Body: message,
    })

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Twilio error:', data)
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp message', details: data }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, messageSid: data.sid }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

