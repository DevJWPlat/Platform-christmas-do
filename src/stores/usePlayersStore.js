// src/stores/usePlayersStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayersStore = defineStore('players', () => {
  // Temporary static data. We'll move this into a DB later.
  const players = ref([
    { id: 'neil', name: 'Neil', points: 3 },
    { id: 'jonny', name: 'Jonny', points: 2 },
    { id: 'sarah', name: 'Sarah', points: 1 },
    { id: 'alex', name: 'Alex', points: 0 },
    // add the rest of the crew here
  ])

  const rankedPlayers = computed(() => {
    return [...players.value]
      .sort((a, b) => b.points - a.points)
      .map((p, index) => ({
        ...p,
        rank: index + 1,
      }))
  })

  return {
    players,
    rankedPlayers,
  }
})
