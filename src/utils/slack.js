// src/utils/slack.js

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/slack`
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function postToSlack(payload) {
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // anon key so Supabase knows it's your project
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error('Slack function error', res.status, await res.text())
    }
  } catch (err) {
    console.error('Failed to send Slack message', err)
  }
}

export function sendSlackText(text) {
  return postToSlack({ text })
}

export function sendNominationToSlack({ nominee, nominator, reason }) {
  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'New nomination 🎄', emoji: true },
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
          text: `*Reason:*\n>${reason || '_No reason given_'}`
        },
      },
    ],
  }

  return postToSlack(payload)
}

export function sendMilestoneToSlack(playerName, points, action) {
  const payload = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Milestone reached :tada:*',
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
    ],
  }

  return postToSlack(payload)
}
