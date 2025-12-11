// src/utils/slack.js
const webhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL

async function postToSlack(payload) {
  if (!webhookUrl) {
    console.warn('Slack webhook URL is not set (VITE_SLACK_WEBHOOK_URL)')
    return
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error('Slack webhook error', await res.text())
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

// 🎯 Milestone reached – matches your call:
// sendMilestoneToSlack(player.name, player.points, milestoneData.action)
export function sendMilestoneToSlack(playerName, points, action) {
  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Milestone reached 🎉",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${playerName}* has now reached *${points} points*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Forfeit:*\n>${action}`,
        },
      },
    ],
  }

  return postToSlack(payload)
}

