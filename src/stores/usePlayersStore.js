// src/stores/usePlayersStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabaseClient'
import { sendMilestoneToSlack } from '../utils/slack'

const milestones = [1, 3, 5, 7, 10, 12, 15, 17, 20, 25, 30]

export const usePlayersStore = defineStore('players', () => {
  const players = ref([])
  const loading = ref(false)
  const subscription = ref(null)

  // Queue for popups (used by MilestonePopup.vue)
  const milestoneNotifications = ref([])
  // History for feed display (future use)
  const milestoneHistory = ref([])

  // Track last known points per player so we can spot changes
  const lastPointsById = ref(new Map())
  // Polling timer (fallback if realtime is flaky)
  const pollTimer = ref(null)

  const rankedPlayers = computed(() => {
    return [...players.value]
      .sort((a, b) => b.points - a.points)
      .map((p, i) => ({
        ...p,
        rank: i + 1,
      }))
  })

  const loadPlayers = async () => {
    loading.value = true
    const { data, error } = await supabase.from('players').select('*')

    if (error) {
      console.error('Error loading players:', error)
      loading.value = false
      return
    }

    players.value = data || []
    loading.value = false
  }

  const getMilestoneAction = (points) => {
    switch (points) {
      case 1:
        return 'Drink two fingers worth of your current drink or speak in a silly accent for 30 seconds.'
      case 3:
        return 'Take a shot or do 5 star jumps'
      case 5:
        return 'Neck half your drink or ask a stranger for a high five'
      case 7:
        return 'Take a photo with the team or get a selfie with a stranger'
      case 10:
        return 'The team chooses your next drink or drink with only your weak hand for the rest of the night (any strong hand drinking will result in a forfeit)'
      case 12:
        return 'Down your drink or do charades to the group (if the group cant guess, you must do a forfeit)'
      case 15:
        return 'Take a shot or do a slut drop'
      case 17:
        return 'The team will create you a forfeit / rule'
      case 20:
        return 'Let the group assign you a “role” (Navigation Officer, Drink Guardian, etc) for the rest of the night.'
      case 25:
        return 'Buy a round or do a shot with a stranger'
      case 30:
        return 'Take a shot, then head to the dance floor or do 5 press ups, 5 star jumps and head to the dance floor'
      default:
        return 'Milestone reached!'
    }
  }

  const triggerMilestonePopup = async (player) => {
    const milestoneData = {
      id: crypto.randomUUID(),
      playerName: player.name,
      playerId: player.id,
      points: player.points,
      action: getMilestoneAction(player.points),
      createdAt: new Date().toISOString(),
    }

    // Add to popup queue
    milestoneNotifications.value.push(milestoneData)

    // Add to history for feed
    milestoneHistory.value.unshift(milestoneData)
    if (milestoneHistory.value.length > 50) {
      milestoneHistory.value = milestoneHistory.value.slice(0, 50)
    }

    if (navigator.vibrate) navigator.vibrate(150)

    // Slack in a try/catch so it never breaks the popup
    try {
      console.log(
        '[Milestones] Sending milestone to Slack:',
        player.name,
        player.points,
        milestoneData.action,
      )
      await sendMilestoneToSlack(player.name, player.points, milestoneData.action)
    } catch (err) {
      console.error('[Milestones] Failed to send milestone to Slack', err)
    }
  }

  /**
   * Core logic: whenever a player's points change, check if
   * the NEW value hits a milestone and if so, trigger popup + Slack.
   */
  const handlePointsChange = (player, oldPoints, newPoints) => {
    console.log(`[Milestones] Points changed for ${player.name}: ${oldPoints} -> ${newPoints}`)

    // Only care about actual changes
    if (oldPoints === newPoints) return

    // Only fire if the NEW value is a milestone
    if (milestones.includes(newPoints)) {
      console.log(`[Milestones] ${player.name} hit milestone ${newPoints} – triggering popup`)
      triggerMilestonePopup(player)
    }
  }

  /**
   * Run through all players and compare points with lastPointsById
   * Used both after initial load and during polling.
   */
  const checkForMilestonesAcrossPlayers = () => {
    const map = lastPointsById.value

    for (const player of players.value) {
      const prev = map.get(player.id) ?? 0
      const curr = Number(player.points ?? 0)

      if (prev !== curr) {
        handlePointsChange(player, prev, curr)
        map.set(player.id, curr)
      }
    }
  }

  const startRealtime = () => {
    // Avoid double subscription
    if (subscription.value) {
      console.log('[Players] Realtime already started')
      return
    }

    console.log('[Players] Starting realtime subscription…')

    subscription.value = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload
          console.log('[Players] Realtime event:', eventType, payload)

          if (eventType === 'INSERT') {
            players.value.push(newRow)
            lastPointsById.value.set(newRow.id, Number(newRow.points ?? 0))
          }

          if (eventType === 'UPDATE') {
            const idx = players.value.findIndex((p) => p.id === newRow.id)
            if (idx !== -1) {
              const oldPoints = Number(players.value[idx].points ?? 0)
              const newPoints = Number(newRow.points ?? 0)

              players.value[idx] = newRow
              lastPointsById.value.set(newRow.id, newPoints)

              handlePointsChange(newRow, oldPoints, newPoints)
            }
          }

          if (eventType === 'DELETE') {
            players.value = players.value.filter((p) => p.id !== oldRow.id)
            lastPointsById.value.delete(oldRow.id)
          }
        },
      )
      .subscribe((status) => {
        console.log('[Players] Realtime channel status:', status)
      })

    // 🔁 Fallback polling every 5 seconds for extra safety
    if (!pollTimer.value) {
      console.log('[Players] Starting 5s polling fallback for milestones')
      pollTimer.value = setInterval(async () => {
        try {
          await loadPlayers()
          checkForMilestonesAcrossPlayers()
        } catch (err) {
          console.error('[Players] Polling error', err)
        }
      }, 5000)
    }
  }

  const stopRealtime = () => {
    if (subscription.value) {
      console.log('[Players] Stopping realtime subscription')
      supabase.removeChannel(subscription.value)
      subscription.value = null
    }

    if (pollTimer.value) {
      clearInterval(pollTimer.value)
      pollTimer.value = null
    }
  }

  /**
   * Helper to be called on app start:
   *  - loads players
   *  - initialises lastPointsById
   *  - checks if anyone already sits on a milestone (in case points were changed while app closed)
   */
  const initPlayers = async () => {
    await loadPlayers()

    const map = new Map()
    for (const p of players.value) {
      const pts = Number(p.points ?? 0)
      map.set(p.id, pts)
    }
    lastPointsById.value = map

    console.log('[Players] Players loaded with numeric points:', players.value)
  }

  return {
    players,
    rankedPlayers,
    loading,
    // lifecycle helpers
    loadPlayers,
    initPlayers,
    startRealtime,
    stopRealtime,
    // milestone data
    milestoneNotifications,
    milestoneHistory,
  }
})
