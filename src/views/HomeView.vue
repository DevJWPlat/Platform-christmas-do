<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePlayersStore } from '../stores/usePlayersStore'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'
import { useVotesStore } from '../stores/useVotesStore'
import NominateModal from '../components/NominateModal.vue'
import VoteNotification from '../components/VoteNotification.vue'
import { supabase } from '../supabaseClient'
import MilestonePopup from '../components/MilestonePopup.vue'
import { useRouter } from 'vue-router'
import { getPlayerImage } from '../utils/playerImages'

const router = useRouter()

/* STORES */
const playersStore = usePlayersStore()
const votesStore = useVotesStore()
const currentUserStore = useCurrentUserStore()
const currentUser = computed(() => currentUserStore.user)

/* COMPUTED */
const rankedPlayers = computed(() => playersStore.rankedPlayers)

/* HAMBURGER MENU */
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const navigateTo = (route) => {
  router.push(route)
  closeMenu()
}

/* NOMINATION MODAL */
const selectedPlayer = ref(null)
const isNominateOpen = ref(false)

const openNominate = (player) => {
  selectedPlayer.value = player
  isNominateOpen.value = true
}

const handleCloseNominate = () => {
  selectedPlayer.value = null
  isNominateOpen.value = false
}

const handleSubmitNomination = async ({ playerId, reason }) => {
  if (!currentUser.value) return

  // now + 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error } = await supabase.from('votes').insert({
    target_id: playerId,
    created_by_id: currentUser.value.id,
    reason,
    expires_at: expiresAt,
  })

  if (error) {
    console.error('Error creating vote:', error)
    alert('Could not create vote, check console.')
    return
  }

  // close modal
  selectedPlayer.value = null
  isNominateOpen.value = false
}

/* LIFECYCLE */
onMounted(() => {
  playersStore.loadPlayers() // load players from Supabase
  playersStore.startRealtime() // start realtime updates
  votesStore.startRealtime() // start listening for votes
  votesStore.resolveExpiredVotes() // auto-resolve any old pending votes
})

onBeforeUnmount(() => {
  votesStore.stopRealtime()
  playersStore.stopRealtime()
})

/* LOGOUT */
const logout = () => {
  currentUserStore.logout()
  closeMenu()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="wrapper">
        <div class="app-header-left">
          <router-link :to="{ name: 'home' }" class="logo-pill">
            <img src="/logo.svg" alt="Logo" class="logo-img" />
          </router-link>
          <div class="app-title">
            <span class="app-title-main">Christmas Do</span>
            <span class="app-title-sub"> Logged in as {{ currentUser?.name }} </span>
          </div>
        </div>

        <button
          :class="['icon-button', { 'icon-button-active': isMenuOpen }]"
          type="button"
          @click="toggleMenu"
        >
          <span></span>
        </button>
      </div>
    </header>

    <!-- Hamburger Menu -->
    <Transition name="menu">
      <div v-if="isMenuOpen" class="menu-backdrop" @click="closeMenu">
        <div class="menu-panel" @click.stop>
          <div class="menu-header">
            <h3 class="menu-title">Menu</h3>
            <button class="menu-close" @click="closeMenu">✕</button>
          </div>

          <nav class="menu-nav">
            <button class="menu-item" @click="navigateTo({ name: 'home' })">
              <span class="menu-item-icon">📊</span>
              <span class="menu-item-text">Leaderboard</span>
            </button>

            <button class="menu-item" @click="navigateTo({ name: 'feed' })">
              <span class="menu-item-icon">⚡</span>
              <span class="menu-item-text">Activity Feed</span>
            </button>

            <button class="menu-item" @click="navigateTo({ name: 'rules' })">
              <span class="menu-item-icon">📜</span>
              <span class="menu-item-text">Points Rules</span>
            </button>

            <div class="menu-divider"></div>

            <button class="menu-item menu-item-danger logout" @click="logout">
              <span class="menu-item-icon">↩️</span>
              <span class="menu-item-text">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </Transition>

    <main class="app-main">
      <section>
        <div class="section-header">
          <div>
            <h1 class="section-title">Players</h1>
            <p class="section-tagline">Tap a player to nominate a point</p>
          </div>
          <div class="points-legend-pill">Rank #1 isn't where you want to be</div>
        </div>

        <div class="player-list">
          <button
            v-for="player in rankedPlayers"
            :key="player.id"
            type="button"
            :class="['player-card', { 'player-card-disabled': player.id === currentUser?.id }]"
            :disabled="player.id === currentUser?.id"
            @click="player.id !== currentUser?.id && openNominate(player)"
          >
            <div class="player-avatar">
              <img
                v-if="getPlayerImage(player.name)"
                :src="getPlayerImage(player.name)"
                :alt="player.name"
                class="player-avatar-img"
              />
              <span v-else class="player-avatar-fallback">
                {{ player.name.charAt(0) }}
              </span>
            </div>

            <div class="player-main">
              <div class="player-name-row">
                <span class="player-name">{{ player.name }}</span>
                <span v-if="player.id !== currentUser?.id" class="player-tag">
                  Tap to nominate
                </span>
              </div>
            </div>

            <div class="player-points">
              <div class="points-badge">
                <span>{{ player.points }}</span> pts
              </div>
              <div class="player-rank">Rank #{{ player.rank }}</div>
            </div>
          </button>
        </div>

        <div class="bottom-hint-bar">
          <div class="bottom-hint-inner">
            <p class="bottom-hint-text">
              <strong>First point</strong> of the night triggers a shot.
            </p>
            <button class="bottom-hint-cta" type="button" @click="$router.push('/rules')">
              View point milestones
            </button>
          </div>
        </div>
      </section>

      <NominateModal
        :open="isNominateOpen"
        :player="selectedPlayer"
        @close="handleCloseNominate"
        @submit="handleSubmitNomination"
      />
    </main>
  </div>
  <MilestonePopup />
  <VoteNotification />
</template>
