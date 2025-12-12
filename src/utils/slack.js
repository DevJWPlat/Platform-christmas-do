// src/utils/slack.js
import { supabase } from '../supabaseClient'

// Generic helper to call the Supabase Edge Function
async function callSlackFunction(body) {
  try {
    const { data, error } = await supabase.functions.invoke('slack', {
      body,
    })

    if (error) {
      console.error('Slack function error', error)
    } else {
      console.log('Slack function OK:', data)
    }
  } catch (err) {
    console.error('Failed to call Slack function', err)
  }
}

// Optional plain text helper if you ever want it
export function sendSlackText(text) {
  return callSlackFunction({
    type: 'text',
    text,
  })
}

// 🎄 Nomination notification
export function sendNominationToSlack({ nominee, nominator, reason }) {
  return callSlackFunction({
    type: 'nomination',
    nominee,
    nominator,
    reason,
  })
}

// 🎉 Milestone notification
export function sendMilestoneToSlack(playerName, points, action) {
  return callSlackFunction({
    type: 'milestone',
    playerName,
    points,
    action,
  })
}
