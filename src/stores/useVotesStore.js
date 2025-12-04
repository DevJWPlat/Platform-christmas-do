// src/stores/useVotesStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabaseClient'
import { usePlayersStore } from './usePlayersStore'
import { useCurrentUserStore } from './useCurrentUserStore'

export const useVotesStore = defineStore('votes', () => {
  const pendingNotifications = ref([])
  const subscription = ref(null)

  console.log('"votes" store installed 🧃')

  const startRealtime = () => {
    const currentUserStore = useCurrentUserStore()
    const playersStore = usePlayersStore()

    if (subscription.value) return

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
          console.log('Realtime vote payload:', payload)
          const vote = payload.new

          // ignore votes created by this user
          if (vote.created_by_id === currentUserStore.user?.id) return

          const target = playersStore.players.find(p => p.id === vote.target_id)
          const creator = playersStore.players.find(
            p => p.id === vote.created_by_id
          )

          const decoratedVote = {
            ...vote,
            targetName: target?.name || vote.target_id,
            creatorName: creator?.name || vote.created_by_id,
          }

          pendingNotifications.value.push(decoratedVote)

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
    const { error } = await supabase.from('vote_responses').insert({
      vote_id: voteId,
      user_id: userId,
      response,
    })

    if (error) {
      console.error('Error saving vote response:', error)
    }
  }

  // 🔥 NEW: resolve expired votes and award points
  const resolveExpiredVotes = async () => {
    // 1. get expired, still-pending votes
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
      // 2. get responses for this vote
      const { data: responses, error: respError } = await supabase
        .from('vote_responses')
        .select('response')
        .eq('vote_id', vote.id)
  
      if (respError) {
        console.error('Error fetching responses:', respError)
        continue
      }
  
      let finalStatus = 'approved' // default
  
      if (responses.length === 0) {
        // nobody replied in 5 minutes → vote sticks
        finalStatus = 'approved'
      } else {
        const agree = responses.filter(r => r.response === 'agree').length
        const disagree = responses.filter(r => r.response === 'disagree').length
  
        // new rule: 4+ yes vs 4+ no
        if (agree >= 4 && disagree < 4) {
          finalStatus = 'approved'
        } else if (disagree >= 4 && agree < 4) {
          finalStatus = 'rejected'
        } else {
          // no 4+ majority, fall back to simple majority
          finalStatus = disagree >= agree ? 'rejected' : 'approved'
        }
      }
  
      // 3. update the vote status
      const { error: updateError } = await supabase
        .from('votes')
        .update({ status: finalStatus })
        .eq('id', vote.id)
  
      if (updateError) {
        console.error('Error updating vote status:', updateError)
        continue
      }
  
      console.log(`Vote ${vote.id} resolved as ${finalStatus}`)
  
      // 4. if approved, bump player points (leave as you already had it)
      if (finalStatus === 'approved') {
        const { error: rpcError } = await supabase.rpc('increment_player_points', {
          player_id: vote.target_id,
        })
  
        if (rpcError) {
          console.error('Error incrementing player points:', rpcError)
        }
      }
    }
  }
  

  return {
    pendingNotifications,
    startRealtime,
    stopRealtime,
    popNextNotification,
    respondToVote,
    resolveExpiredVotes, // 👈 IMPORTANT: exported here
  }
})
