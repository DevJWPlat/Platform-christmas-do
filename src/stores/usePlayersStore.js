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
  const milestoneNotifications = ref([]) // 👈 MOVED TO STORE LEVEL

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
    } else {
      players.value = data
    }

    loading.value = false
  }

  const getMilestoneAction = (points) => {
    switch (points) {
      case 1:
        return 'Drink two fingers worth of your current drink'
      case 3:
        return 'Take a shot'
      case 5:
        return 'Neck half your drink'
      case 7:
        return 'Take a photo with the team'
      case 10:
        return 'The team chooses your next drink'
      case 12:
        return 'Down your drink'
      case 15:
        return 'Take a shot'
      case 17:
        return 'The team will create you a forfeit / rule'
      case 20:
        return 'Let the group assign you a “role” (Navigation Officer, Drink Guardian, etc) for the rest of the night.'
      case 25:
        return 'Buy a round'
      case 30:
        return 'Take a shot, then head to the dance floor'
      default:
        return 'Milestone reached!'
    }
  }

  const triggerMilestonePopup = async (player) => {
    const milestoneData = {
      id: crypto.randomUUID(),
      playerName: player.name,
      points: player.points,
      action: getMilestoneAction(player.points),
    }

    milestoneNotifications.value.push(milestoneData)

    // optional: vibrate for effect
    if (navigator.vibrate) navigator.vibrate(150)

    // Send Slack notification
    await sendMilestoneToSlack(player.name, player.points, milestoneData.action)
  }

  const startRealtime = () => {
    if (subscription.value) return // already subscribed

    subscription.value = supabase
      .channel('players-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'players',
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload
          console.log('Players realtime:', eventType, payload)

          if (eventType === 'INSERT') {
            players.value.push(newRow)
          }

          if (eventType === 'UPDATE') {
            const idx = players.value.findIndex((p) => p.id === newRow.id)

            if (idx !== -1) {
              const oldPoints = players.value[idx].points
              const newPoints = newRow.points

              players.value[idx] = newRow

              // 🔥 Check if they HIT a milestone
              if (milestones.includes(newPoints) && newPoints !== oldPoints) {
                triggerMilestonePopup(newRow)
              }
            }
          }

          if (eventType === 'DELETE') {
            players.value = players.value.filter((p) => p.id !== oldRow.id)
          }
        },
      )
      .subscribe()
  }

  const stopRealtime = () => {
    if (subscription.value) {
      supabase.removeChannel(subscription.value)
      subscription.value = null
    }
  }

  return {
    players,
    rankedPlayers,
    loading,
    loadPlayers,
    startRealtime,
    stopRealtime,
    milestoneNotifications, // 👈 EXPORTED
  }
})
