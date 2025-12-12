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
  // Polling timer (fallback)
  const pollTimer = ref(null)

  const rankedPlayers = computed(() => {
    return [...players.value]
      .sort((a, b) => (Number(b.points ?? 0) - Number(a.points ?? 0)))
      .map((p, i) => ({ ...p, rank: i + 1 }))
  })

  // ✅ This is the real loader (what older code expects)
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
      points: Number(player.points ?? 0),
      action: getMilestoneAction(Number(player.points ?? 0)),
      createdAt: new Date().toISOString(),
    }

    milestoneNotifications.value.push(milestoneData)

    milestoneHistory.value.unshift(milestoneData)
    if (milestoneHistory.value.length > 50) {
      milestoneHistory.value = milestoneHistory.value.slice(0, 50)
    }

    if (navigator.vibrate) navigator.vibrate(150)

    // Never let Slack failure break popups
    try {
      await sendMilestoneToSlack(player.name, milestoneData.points, milestoneData.action)
    } catch (err) {
      console.error('[Milestones] Failed to send milestone to Slack', err)
    }
  }

  const handlePointsChange = (player, oldPoints, newPoints) => {
    if (oldPoints === newPoints) return
    if (milestones.includes(newPoints)) {
      triggerMilestonePopup({ ...player, points: newPoints })
    }
  }

  const checkForMilestonesAcrossPlayers = () => {
    const map = lastPointsById.value

    for (const player of players.value) {
      const prev = Number(map.get(player.id) ?? 0)
      const curr = Number(player.points ?? 0)

      if (prev !== curr) {
        handlePointsChange(player, prev, curr)
        map.set(player.id, curr)
      }
    }
  }

  const startRealtime = () => {
    if (subscription.value) return

    subscription.value = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players' },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload

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
      .subscribe()

    // fallback polling (helps if realtime misses updates)
    if (!pollTimer.value) {
      pollTimer.value = setInterval(async () => {
        await loadPlayers()
        checkForMilestonesAcrossPlayers()
      }, 5000)
    }
  }

  const stopRealtime = () => {
    if (subscription.value) {
      supabase.removeChannel(subscription.value)
      subscription.value = null
    }
    if (pollTimer.value) {
      clearInterval(pollTimer.value)
      pollTimer.value = null
    }
  }

  // ✅ Call this on app start/login view
  const initPlayers = async () => {
    await loadPlayers()

    const map = new Map()
    for (const p of players.value) {
      map.set(p.id, Number(p.points ?? 0))
    }
    lastPointsById.value = map
  }

  return {
    players,
    rankedPlayers,
    loading,

    // ✅ BOTH exist now so nothing breaks
    loadPlayers,
    initPlayers,

    startRealtime,
    stopRealtime,

    milestoneNotifications,
    milestoneHistory,
  }
})
