// src/stores/usePlayersStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabaseClient'

const milestones = [1, 5, 10, 15, 20, 25]

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
        return 'Take a shot'
      case 5:
        return 'Take a shot'
      case 10:
        return 'Down your drink'
      case 15:
        return 'Your team will invent a forfeit for you'
      case 20:
        return 'Buy a round'
      case 25:
        return 'Take a shot'
      default:
        return 'Forfeit reached!'
    }
  }

  const triggerMilestonePopup = (player) => {
    const milestoneData = {
      id: crypto.randomUUID(),
      playerName: player.name,
      points: player.points,
      action: getMilestoneAction(player.points),
    }

    milestoneNotifications.value.push(milestoneData)

    // optional: vibrate for effect
    if (navigator.vibrate) navigator.vibrate(150)

    // Open WhatsApp with pre-filled message
    // Replace with your WhatsApp group number (format: country code + number, no + or spaces)
    // Example: 447123456789 for UK, or 1234567890 for US
    const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '447123456789' // Default fallback

    const message = encodeURIComponent(
      `🎯 MILESTONE REACHED! 🎯\n\n${player.name} just reached ${player.points} points!\n\nConsequence: ${milestoneData.action}\n\nTime to pay up! 🍻`,
    )

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`

    // Open WhatsApp in a new tab/window
    // On mobile, this will open the WhatsApp app
    // On desktop, this will open WhatsApp Web
    window.open(whatsappUrl, '_blank')
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
