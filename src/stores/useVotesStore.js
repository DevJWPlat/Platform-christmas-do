// src/stores/useVotesStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabaseClient'
import { usePlayersStore } from './usePlayersStore'
import { useCurrentUserStore } from './useCurrentUserStore'

export const useVotesStore = defineStore('votes', () => {
  const pendingNotifications = ref([]) // queue of votes to show as popups
  const subscription = ref(null)

  const startRealtime = () => {
    const currentUserStore = useCurrentUserStore()
    const playersStore = usePlayersStore()

    if (subscription.value) return // already subscribed

    subscription.value = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
        },
        payload => {
          const vote = payload.new

          // ignore if current user created this vote
          if (vote.created_by_id === currentUserStore.user?.id) return

          // decorate with names from players store
          const target = playersStore.players.find(p => p.id === vote.target_id)
          const creator = playersStore.players.find(
            p => p.id === vote.created_by_id
          )

          const decoratedVote = {
            ...vote,
            targetName: target?.name || vote.target_id,
            creatorName: creator?.name || vote.created_by_id,
          }

          // push onto queue
          pendingNotifications.value.push(decoratedVote)

          // optional: quick little vibration
          if (navigator.vibrate) {
            navigator.vibrate(80)
          }
        }
      )
      .subscribe()
  }

  const stopRealtime = () => {
    if (subscription.value) {
      supabase.removeChannel(subscription.value)
      subscription.value = null
    }
  }

  const popNextNotification = () => {
    return pendingNotifications.value.shift() || null
  }

  const respondToVote = async (voteId, response, userId) => {
    await supabase.from('vote_responses').insert({
      vote_id: voteId,
      user_id: userId,
      response,
    })
  }

  return {
    pendingNotifications,
    startRealtime,
    stopRealtime,
    popNextNotification,
    respondToVote,
  }
})

// Resolve any votes that have expired and still pending
const resolveExpiredVotes = async () => {
    // 1. Fetch all expired pending votes
    const { data: expiredVotes, error: expiredError } = await supabase
      .from('votes')
      .select('*')
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
  
    if (expiredError) {
      console.error('Error fetching expired votes:', expiredError)
      return
    }
  
    if (!expiredVotes || expiredVotes.length === 0) return
  
    console.log('Expired votes to resolve:', expiredVotes)
  
    for (const vote of expiredVotes) {
      // 2. Count responses
      const { data: responses, error: respError } = await supabase
        .from('vote_responses')
        .select('response')
        .eq('vote_id', vote.id)
  
      if (respError) {
        console.error('Error fetching responses:', respError)
        continue
      }
  
      const agree = responses.filter(r => r.response === 'agree').length
      const disagree = responses.filter(r => r.response === 'disagree').length
  
      let finalStatus = 'approved'
  
      // Rule: if no responses → approve
      // If disagrees >= agrees → reject
      if (responses.length > 0 && disagree >= agree) {
        finalStatus = 'rejected'
      }
  
      // 3. Update the vote status
      const { error: updateError } = await supabase
        .from('votes')
        .update({ status: finalStatus })
        .eq('id', vote.id)
  
      if (updateError) {
        console.error('Error updating vote status:', updateError)
        continue
      }
  
      console.log(`Vote ${vote.id} resolved as ${finalStatus}`)
  
      // 4. If approved, update the player's points
      if (finalStatus === 'approved') {
        await supabase.rpc('increment_player_points', {
          player_id: vote.target_id,
        })
      }
    }
  }
  