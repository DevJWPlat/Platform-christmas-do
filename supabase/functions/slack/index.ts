// supabase/functions/slack/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // or lock to https://platform.christmas
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    if (!webhookUrl) {
      console.error('SLACK_WEBHOOK_URL is not set in Vault / env')
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { type } = body as { type: string }

    let payload: Record<string, unknown>

    if (type === 'nomination') {
      const { nominee, nominator, reason } = body

      payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'New nomination 🎄',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${nominator}* nominated *${nominee}* for a point.`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Reason:*\n>${reason || '_No reason given_'}`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Add your vote now:* <https://platform.christmas/|Open Platform Christmas>',
            },
          },
        ],
      }
    } else if (type === 'milestone') {
      const { playerName, points, action } = body

      payload = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Milestone reached 🎉',
              emoji: true,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${playerName}* has now reached *${points} points*`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Forfeit:*\n>${action}`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '<https://platform.christmas/|Open Platform Christmas>',
            },
          },
        ],
      }
    } else if (type === 'text') {
      // Simple text fallback if you ever need it
      payload = { text: body.text ?? 'Message from PlatformChristmas' }
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!slackRes.ok) {
      const text = await slackRes.text()
      console.error('Slack error:', text)
      return new Response(JSON.stringify({ error: 'Slack error', details: text }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error in slack function:', err)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
