// src/stores/useVotesStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabaseClient'
import { useCurrentUserStore } from './useCurrentUserStore'

export const useVotesStore = defineStore('votes', () => {
  const nominationNotifications = ref([]) // popup queue
  const subscription = ref(null)

  const enqueueNomination = (voteRow) => {
    nominationNotifications.value.push({
      id: voteRow.id,
      targetId: voteRow.target_id,
      createdById: voteRow.created_by_id,
      reason: voteRow.reason,
      expiresAt: voteRow.expires_at,
      status: voteRow.status,
    })
  }

  const startRealtime = () => {
    if (subscription.value) return
  
    console.log('[votes] starting realtime…')
  
    subscription.value = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          console.log('[votes] realtime INSERT payload:', payload)
  
          const vote = payload.new
          if (!vote) return
  
          if (vote.status && vote.status !== 'pending') return
  
          enqueueNomination(vote)
          console.log('[votes] queued nominationNotifications length:', nominationNotifications.value.length)
        },
      )
      .subscribe((status) => {
        console.log('[votes] channel status:', status)
      })
  }
  

  const stopRealtime = () => {
    if (subscription.value) {
      supabase.removeChannel(subscription.value)
      subscription.value = null
    }
  }

  const acceptNomination = async (voteId) => {
    const currentUserStore = useCurrentUserStore()
    const resolverId = currentUserStore.user?.id || null

    // Fetch vote first (safer than fetching after update)
    const { data: voteRow, error: fetchErr } = await supabase
      .from('votes')
      .select('target_id, status')
      .eq('id', voteId)
      .single()

    if (fetchErr) throw fetchErr
    if (voteRow?.status && voteRow.status !== 'pending') return

    // Mark vote accepted
    const { error: voteErr } = await supabase
      .from('votes')
      .update({
        status: 'accepted',
        resolved_at: new Date().toISOString(),
        resolved_by_id: resolverId,
      })
      .eq('id', voteId)

    if (voteErr) throw voteErr

    // OPTIONAL: add a point to the target player
    if (voteRow?.target_id) {
      const { data: player, error: pErr } = await supabase
        .from('players')
        .select('points')
        .eq('id', voteRow.target_id)
        .single()

      if (pErr) {
        console.error('Could not fetch player points', pErr)
        return
      }

      await supabase
        .from('players')
        .update({ points: (player.points || 0) + 1 })
        .eq('id', voteRow.target_id)
    }
  }

  const declineNomination = async (voteId) => {
    const currentUserStore = useCurrentUserStore()
    const resolverId = currentUserStore.user?.id || null

    const { error } = await supabase
      .from('votes')
      .update({
        status: 'declined',
        resolved_at: new Date().toISOString(),
        resolved_by_id: resolverId,
      })
      .eq('id', voteId)

    if (error) throw error
  }

  const resolveExpiredVotes = async () => {
    const now = new Date().toISOString()

    await supabase
      .from('votes')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', now)
  }

  return {
    nominationNotifications,
    startRealtime,
    stopRealtime,
    acceptNomination,
    declineNomination,
    resolveExpiredVotes,
  }
})
