/**
 * Utility function to send messages to Slack via webhook
 */

const SLACK_WEBHOOK_URL = import.meta.env.VITE_SLACK_WEBHOOK_URL

if (!SLACK_WEBHOOK_URL) {
  console.warn('VITE_SLACK_WEBHOOK_URL is not set. Slack notifications will be disabled.')
}

/**
 * Send a simple text message to Slack
 * @param {string} text - The message text to send
 */
export const sendSlackMessage = async (text) => {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook URL not configured')
    return false
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      console.error('Failed to send Slack message:', response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Slack message:', error)
    return false
  }
}

/**
 * Send a milestone notification to Slack with rich formatting
 * @param {string} playerName - Name of the player who reached the milestone
 * @param {number} points - Points reached
 * @param {string} action - The consequence/action for this milestone
 */
export const sendMilestoneToSlack = async (playerName, points, action) => {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('Slack webhook URL not configured')
    return false
  }

  try {
    const payload = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 Milestone Reached! 🎯',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${playerName}* just reached *${points} point${points !== 1 ? 's' : ''}*!`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Points:*\n${points}`,
            },
            {
              type: 'mrkdwn',
              text: `*Consequence:*\n${action}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🍻 *Time to pay up!* 🍻',
          },
        },
      ],
    }

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Failed to send Slack milestone:', response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Slack milestone:', error)
    return false
  }
}

