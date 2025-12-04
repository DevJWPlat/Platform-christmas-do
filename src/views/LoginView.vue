<script setup>
import { onMounted } from 'vue'
import { usePlayersStore } from '../stores/usePlayersStore'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'
import { useRouter } from 'vue-router'

const playersStore = usePlayersStore()
const currentUserStore = useCurrentUserStore()
const router = useRouter()

// ✅ load players from Supabase when this view mounts
onMounted(() => {
  playersStore.loadPlayers()
})

const selectUser = (player) => {
  currentUserStore.login({
    id: player.id,
    name: player.name,
  })
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-left">
        <div class="logo-pill">
          P
        </div>
        <div class="app-title">
          <span class="app-title-main">Who are you?</span>
          <span class="app-title-sub">Tap your name to join the game</span>
        </div>
      </div>
    </header>

    <main class="app-main">
      <section>
        <div class="section-header">
          <div>
            <h1 class="section-title">Choose your profile</h1>
            <p class="section-tagline">No passwords yet, low security vibes.</p>
          </div>
        </div>

        <!-- simple loading state -->
        <p v-if="playersStore.loading" class="section-tagline">
          Loading players…
        </p>

        <div v-else class="player-list">
          <button
            v-for="player in playersStore.players"
            :key="player.id"
            type="button"
            class="player-card"
            @click="selectUser(player)"
          >
            <div class="player-avatar">
              {{ player.name.charAt(0) }}
            </div>

            <div class="player-main">
              <div class="player-name-row">
                <span class="player-name">{{ player.name }}</span>
                <span class="player-tag">
                  Tap to log in
                </span>
              </div>
              <div class="player-meta">
                You will be able to nominate others & vote.
              </div>
            </div>
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
