// src/stores/useVotesStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabaseClient'
import { useCurrentUserStore } from './useCurrentUserStore'

export const useVotesStore = defineStore('votes', () => {
  const nominationNotifications = ref([]) // popup queue
  const subscription = ref(null)

  const enqueueNomination = async (voteRow) => {
    // fetch names
    const { data: players, error } = await supabase
      .from('players')
      .select('id, name')
      .in('id', [voteRow.created_by_id, voteRow.target_id])
  
    if (error) {
      console.error('Failed to fetch player names', error)
      return
    }
  
    const by = players.find(p => p.id === voteRow.created_by_id)?.name || 'Someone'
    const target = players.find(p => p.id === voteRow.target_id)?.name || 'Someone'
  
    nominationNotifications.value.push({
      id: voteRow.id,
      reason: voteRow.reason,
      createdByName: by,
      targetName: target,
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
        async (payload) => {
          const vote = payload.new
          if (!vote) return
          if (vote.status && vote.status !== 'pending') return
      
          await enqueueNomination(vote)
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
    const resolverName = currentUserStore.user?.name || 'Unknown'

    // fetch vote first
    const { data: voteRow, error: fetchErr } = await supabase
      .from('votes')
      .select('target_id, status')
      .eq('id', voteId)
      .single()

    if (fetchErr) throw fetchErr
    if (voteRow?.status && voteRow.status !== 'pending') return

    // mark accepted (WRITE NAME INTO resolved_by_id)
    const { error: voteErr } = await supabase
      .from('votes')
      .update({
        status: 'accepted',
        resolved_at: new Date().toISOString(),
        resolved_by_id: resolverName, // ✅ option A
      })
      .eq('id', voteId)

    if (voteErr) throw voteErr

    // add a point to the target player
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

      const { error: upErr } = await supabase
        .from('players')
        .update({ points: (player.points || 0) + 1 })
        .eq('id', voteRow.target_id)

      if (upErr) throw upErr
    }
  }

  const declineNomination = async (voteId) => {
    const currentUserStore = useCurrentUserStore()
    const resolverName = currentUserStore.user?.name || 'Unknown'

    const { error } = await supabase
      .from('votes')
      .update({
        status: 'declined',
        resolved_at: new Date().toISOString(),
        resolved_by_id: resolverName, // ✅ option A
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
