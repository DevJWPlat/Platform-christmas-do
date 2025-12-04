<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePlayersStore } from '../stores/usePlayersStore'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'
import { useVotesStore } from '../stores/useVotesStore'
import NominateModal from '../components/NominateModal.vue'
import VoteNotification from '../components/VoteNotification.vue'
import { supabase } from '../supabaseClient'
import MilestonePopup from '../components/MilestonePopup.vue'


/* STORES */
const playersStore = usePlayersStore()
const votesStore = useVotesStore()
const currentUserStore = useCurrentUserStore()
const currentUser = computed(() => currentUserStore.user)


/* COMPUTED */
const rankedPlayers = computed(() => playersStore.rankedPlayers)


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
  playersStore.loadPlayers()         // load players from Supabase
  votesStore.startRealtime()    
  votesStore.startRealtime()     // start listening for votes
  votesStore.resolveExpiredVotes()   // auto-resolve any old pending votes
})

onBeforeUnmount(() => {
  votesStore.stopRealtime()
  playersStore.stopRealtime()
})


/* LOGOUT */
const logout = () => {
  currentUserStore.logout()
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
          <span class="app-title-main">Christmas Do</span>
          <span class="app-title-sub">
            Logged in as {{ currentUser?.name }}
          </span>
        </div>
      </div>

      <button class="icon-button" type="button" @click="logout">
        <span></span>
      </button>
    </header>

    <main class="app-main">
      <section>
        <div class="section-header">
          <div>
            <h1 class="section-title">Players</h1>
            <p class="section-tagline">Tap a player to nominate a point</p>
          </div>
          <div class="points-legend-pill">
            1 point = 1 shot
          </div>
        </div>

        <div class="player-list">
          <button
            v-for="player in rankedPlayers"
            :key="player.id"
            type="button"
            class="player-card"
            @click="openNominate(player)"
          >
            <div class="player-avatar">
              {{ player.name.charAt(0) }}
            </div>

            <div class="player-main">
              <div class="player-name-row">
                <span class="player-name">{{ player.name }}</span>
                <span class="player-tag">
                  Tap to nominate
                </span>
              </div>
              <div class="player-meta">
                Currently on {{ player.points }} point<span v-if="player.points !== 1">s</span>
              </div>
            </div>

            <div class="player-points">
              <div class="points-badge">
                <span>{{ player.points }}</span> pts
              </div>
              <div class="player-rank">
                Rank #{{ player.rank }}
              </div>
            </div>
          </button>
        </div>

        <div class="bottom-hint-bar">
          <div class="bottom-hint-inner">
            <p class="bottom-hint-text">
              <strong>First point</strong> of the night triggers a shot.
            </p>
            <button class="bottom-hint-cta" type="button" @click="$router.push('/rules')">
            View point rules
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
