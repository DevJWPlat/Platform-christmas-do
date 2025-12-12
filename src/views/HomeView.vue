<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePlayersStore } from '../stores/usePlayersStore'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'
import { useVotesStore } from '../stores/useVotesStore'
import NominateModal from '../components/NominateModal.vue'
import VoteNotification from '../components/VoteNotification.vue'
import MilestonePopup from '../components/MilestonePopup.vue'
import { supabase } from '../supabaseClient'
import { useRouter } from 'vue-router'
import { getPlayerImage } from '../utils/playerImages'
import { sendNominationToSlack } from '../utils/slack'

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

  // 🔔 Send Slack message (fire-and-forget, no need to await if you don't want)
  const nominee = selectedPlayer.value?.name || 'Unknown'
  const nominator = currentUser.value.name || 'Unknown'

  try {
    sendNominationToSlack({
      nominee,
      nominator,
      reason,
    })
  } catch (e) {
    console.error('Slack nomination error (ignored so UI still works)', e)
  }

  // close modal
  selectedPlayer.value = null
  isNominateOpen.value = false
}

/* LIFECYCLE */
onMounted(async () => {
  console.log('[HomeView] mounted - starting realtime')
  await playersStore.initPlayers()
  playersStore.startRealtime()
  votesStore.startRealtime()
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
              <span class="menu-item-icon">
                <svg
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  viewBox="0 0 34.46 32.74"
                >
                  <path
                    d="M-85.54,25.23c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c3.26,0,5.91-2.65,5.91-5.91V7.51c0-3.26-2.65-5.91-5.91-5.91h-3.94c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c1.09,0,1.97.88,1.97,1.97v15.75c0,1.09-.88,1.97-1.97,1.97h-3.94ZM-106.62,13.99c-.77.77-.77,2.02,0,2.79l7.88,7.88c.77.77,2.02.77,2.79,0s.77-2.02,0-2.79l-4.52-4.52h12.97c1.09,0,1.97-.88,1.97-1.97s-.88-1.97-1.97-1.97h-12.97l4.52-4.52c.77-.77.77-2.02,0-2.79s-2.02-.77-2.79,0l-7.88,7.88h0Z"
                    style="fill: #ee4d80"
                  />
                  <path
                    d="M-32.49,5.54h-4.92c-.82,0-1.48-.66-1.48-1.48s.66-1.48,1.48-1.48h4.92c.82,0,1.48.66,1.48,1.48s-.66,1.48-1.48,1.48ZM-32.49,8.49c2.28,0,4.16-1.72,4.41-3.94h1.01c.54,0,.98.44.98.98v21.66c0,.54-.44.98-.98.98h-15.75c-.54,0-.98-.44-.98-.98V5.54c0-.54.44-.98.98-.98h1.01c.25,2.22,2.12,3.94,4.41,3.94h4.92ZM-28.8,1.6c-.79-1.19-2.15-1.97-3.69-1.97h-4.92c-1.54,0-2.89.78-3.69,1.97h-1.73c-2.17,0-3.94,1.77-3.94,3.94v21.66c0,2.17,1.77,3.94,3.94,3.94h15.75c2.17,0,3.94-1.77,3.94-3.94V5.54c0-2.17-1.77-3.94-3.94-3.94h-1.73Z"
                    style="fill: #fff"
                  />
                  <path
                    d="M62.19,11.32l-1.58,11.81h9.64c.46,0,.89.21,1.16.57s.38.82.27,1.27l-1.42,5.65,7.05-10.44h-9.03c-.49,0-.94-.24-1.22-.64s-.33-.92-.16-1.37l2.66-6.85h-7.38ZM59.32,10.51c.16-1.22,1.21-2.14,2.44-2.14h8.53c1.73,0,2.92,1.74,2.3,3.35l-2.14,5.51h7.8c1.98,0,3.14,2.2,2.04,3.84l-12.26,18.15c-.4.6-1.17.81-1.83.52s-1-1.01-.83-1.7l2.98-11.95h-8.31c-1.48,0-2.63-1.31-2.43-2.79,0,0,1.7-12.8,1.7-12.8Z"
                    style="fill: #fff"
                  />
                  <path
                    d="M24.12,8.92c.81-.23,1.69-.31,2.58-.31h1.72c1.71,0,3.4.26,4.58,1.45s1.45,2.87,1.45,4.58v12.06c0,1.71-.26,3.4-1.45,4.58s-2.87,1.45-4.58,1.45H6.03c-1.71,0-3.4-.26-4.58-1.45s-1.45-2.87-1.45-4.58v-5.17c0-1.71.26-3.4,1.45-4.58,1.18-1.19,2.87-1.45,4.58-1.45h1.72c.89,0,1.77.07,2.58.31V6.03c0-1.71.26-3.4,1.45-4.58s2.87-1.45,4.58-1.45h1.72c1.71,0,3.4.26,4.58,1.45,1.19,1.18,1.45,2.87,1.45,4.58v2.89ZM13.78,29.29h6.89V6.03c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v23.26ZM10.34,29.29v-7.75c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v5.17c0,1.52.28,1.99.44,2.15s.63.44,2.15.44h4.31ZM24.12,29.29h4.31c1.52,0,1.99-.28,2.15-.44s.44-.63.44-2.15v-12.06c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v14.65Z"
                    style="fill: #fff"
                  />
                </svg>
              </span>
              <span class="menu-item-text">Leaderboard</span>
            </button>

            <button class="menu-item" @click="navigateTo({ name: 'feed' })">
              <span class="menu-item-icon">
                <svg
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  viewBox="0 0 23.12 31.5"
                >
                  <path
                    d="M-143.13,16.86c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c3.26,0,5.91-2.65,5.91-5.91V-.86c0-3.26-2.65-5.91-5.91-5.91h-3.94c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c1.09,0,1.97.88,1.97,1.97v15.75c0,1.09-.88,1.97-1.97,1.97h-3.94ZM-164.21,5.62c-.77.77-.77,2.02,0,2.79l7.88,7.88c.77.77,2.02.77,2.79,0s.77-2.02,0-2.79l-4.52-4.52h12.97c1.09,0,1.97-.88,1.97-1.97s-.88-1.97-1.97-1.97h-12.97l4.52-4.52c.77-.77.77-2.02,0-2.79s-2.02-.77-2.79,0l-7.88,7.88h0Z"
                    style="fill: #ee4d80"
                  />
                  <path
                    d="M-90.08-2.83h-4.92c-.82,0-1.48-.66-1.48-1.48s.66-1.48,1.48-1.48h4.92c.82,0,1.48.66,1.48,1.48s-.66,1.48-1.48,1.48ZM-90.08.12c2.28,0,4.16-1.72,4.41-3.94h1.01c.54,0,.98.44.98.98v21.66c0,.54-.44.98-.98.98h-15.75c-.54,0-.98-.44-.98-.98V-2.83c0-.54.44-.98.98-.98h1.01c.25,2.22,2.12,3.94,4.41,3.94h4.92ZM-86.4-6.77c-.79-1.19-2.15-1.97-3.69-1.97h-4.92c-1.54,0-2.89.78-3.69,1.97h-1.73c-2.17,0-3.94,1.77-3.94,3.94v21.66c0,2.17,1.77,3.94,3.94,3.94h15.75c2.17,0,3.94-1.77,3.94-3.94V-2.83c0-2.17-1.77-3.94-3.94-3.94h-1.73Z"
                    style="fill: #fff"
                  />
                  <path
                    d="M4.59,2.95l-1.58,11.81h9.64c.46,0,.89.21,1.16.57s.38.82.27,1.27l-1.42,5.65,7.05-10.44h-9.03c-.49,0-.94-.24-1.22-.64s-.33-.92-.16-1.37l2.66-6.85h-7.38ZM1.73,2.14c.16-1.22,1.21-2.14,2.44-2.14h8.53c1.73,0,2.92,1.74,2.3,3.35l-2.14,5.51h7.8c1.98,0,3.14,2.2,2.04,3.84l-12.26,18.15c-.4.6-1.17.81-1.83.52s-1-1.01-.83-1.7l2.98-11.95H2.45C.97,17.72-.17,16.41.02,14.93.02,14.93,1.73,2.14,1.73,2.14Z"
                    style="fill: #fff"
                  />
                  <path
                    d="M-33.47.55c.81-.23,1.69-.31,2.58-.31h1.72c1.71,0,3.4.26,4.58,1.45s1.45,2.87,1.45,4.58v12.06c0,1.71-.26,3.4-1.45,4.58s-2.87,1.45-4.58,1.45h-22.4c-1.71,0-3.4-.26-4.58-1.45s-1.45-2.87-1.45-4.58v-5.17c0-1.71.26-3.4,1.45-4.58,1.18-1.19,2.87-1.45,4.58-1.45h1.72c.89,0,1.77.07,2.58.31V-2.34c0-1.71.26-3.4,1.45-4.58s2.87-1.45,4.58-1.45h1.72c1.71,0,3.4.26,4.58,1.45,1.19,1.18,1.45,2.87,1.45,4.58V.55ZM-43.81,20.92h6.89V-2.34c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v23.26ZM-47.26,20.92v-7.75c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v5.17c0,1.52.28,1.99.44,2.15s.63.44,2.15.44h4.31ZM-33.47,20.92h4.31c1.52,0,1.99-.28,2.15-.44s.44-.63.44-2.15V6.28c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v14.65Z"
                    style="fill: #fff"
                  />
                </svg>
              </span>
              <span class="menu-item-text">Activity Feed</span>
            </button>

            <button class="menu-item" @click="navigateTo({ name: 'rules' })">
              <span class="menu-item-icon">
                <svg
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  viewBox="0 0 23.63 31.51"
                >
                  <path
                    d="M-38.77,25.6c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c3.26,0,5.91-2.65,5.91-5.91V7.88c0-3.26-2.65-5.91-5.91-5.91h-3.94c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c1.09,0,1.97.88,1.97,1.97v15.75c0,1.09-.88,1.97-1.97,1.97h-3.94ZM-59.86,14.36c-.77.77-.77,2.02,0,2.79l7.88,7.88c.77.77,2.02.77,2.79,0s.77-2.02,0-2.79l-4.52-4.52h12.97c1.09,0,1.97-.88,1.97-1.97s-.88-1.97-1.97-1.97h-12.97l4.52-4.52c.77-.77.77-2.02,0-2.79s-2.02-.77-2.79,0l-7.88,7.88h0Z"
                    style="fill: #ee4d80"
                  />
                  <path
                    d="M14.28,5.91h-4.92c-.82,0-1.48-.66-1.48-1.48s.66-1.48,1.48-1.48h4.92c.82,0,1.48.66,1.48,1.48s-.66,1.48-1.48,1.48ZM14.28,8.86c2.28,0,4.16-1.72,4.41-3.94h1.01c.54,0,.98.44.98.98v21.66c0,.54-.44.98-.98.98H3.94c-.54,0-.98-.44-.98-.98V5.91c0-.54.44-.98.98-.98h1.01c.25,2.22,2.12,3.94,4.41,3.94h4.92ZM17.96,1.97c-.79-1.19-2.15-1.97-3.69-1.97h-4.92c-1.54,0-2.89.78-3.69,1.97h-1.73C1.77,1.97,0,3.74,0,5.91v21.66c0,2.17,1.77,3.94,3.94,3.94h15.75c2.17,0,3.94-1.77,3.94-3.94V5.91c0-2.17-1.77-3.94-3.94-3.94h-1.73Z"
                    style="fill: #fff"
                  />
                  <path
                    d="M108.95,11.69l-1.58,11.81h9.64c.46,0,.89.21,1.16.57s.38.82.27,1.27l-1.42,5.65,7.05-10.44h-9.03c-.49,0-.94-.24-1.22-.64s-.33-.92-.16-1.37l2.66-6.85h-7.38ZM106.09,10.87c.16-1.22,1.21-2.14,2.44-2.14h8.53c1.73,0,2.92,1.74,2.3,3.35l-2.14,5.51h7.8c1.98,0,3.14,2.2,2.04,3.84l-12.26,18.15c-.4.6-1.17.81-1.83.52s-1-1.01-.83-1.7l2.98-11.95h-8.31c-1.48,0-2.63-1.31-2.43-2.79,0,0,1.7-12.8,1.7-12.8Z"
                    style="fill: #fff"
                  />
                  <path
                    d="M70.89,9.29c.81-.23,1.69-.31,2.58-.31h1.72c1.71,0,3.4.26,4.58,1.45s1.45,2.87,1.45,4.58v12.06c0,1.71-.26,3.4-1.45,4.58s-2.87,1.45-4.58,1.45h-22.4c-1.71,0-3.4-.26-4.58-1.45s-1.45-2.87-1.45-4.58v-5.17c0-1.71.26-3.4,1.45-4.58,1.18-1.19,2.87-1.45,4.58-1.45h1.72c.89,0,1.77.07,2.58.31V6.4c0-1.71.26-3.4,1.45-4.58s2.87-1.45,4.58-1.45h1.72c1.71,0,3.4.26,4.58,1.45,1.19,1.18,1.45,2.87,1.45,4.58v2.89ZM60.55,29.66h6.89V6.4c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v23.26ZM57.1,29.66v-7.75c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v5.17c0,1.52.28,1.99.44,2.15s.63.44,2.15.44h4.31ZM70.89,29.66h4.31c1.52,0,1.99-.28,2.15-.44s.44-.63.44-2.15v-12.06c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v14.65Z"
                    style="fill: #fff"
                  />
                </svg>
              </span>
              <span class="menu-item-text">Points Rules</span>
            </button>

            <div class="menu-divider"></div>

            <button class="menu-item menu-item-danger logout" @click="logout">
              <span class="menu-item-icon">
                <svg
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  version="1.1"
                  viewBox="0 0 31.5 27.57"
                >
                  <path
                    d="M21.66,23.63c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c3.26,0,5.91-2.65,5.91-5.91V5.91c0-3.26-2.65-5.91-5.91-5.91h-3.94c-1.09,0-1.97.88-1.97,1.97s.88,1.97,1.97,1.97h3.94c1.09,0,1.97.88,1.97,1.97v15.75c0,1.09-.88,1.97-1.97,1.97h-3.94ZM.58,12.39c-.77.77-.77,2.02,0,2.79l7.88,7.88c.77.77,2.02.77,2.79,0s.77-2.02,0-2.79l-4.52-4.52h12.97c1.09,0,1.97-.88,1.97-1.97s-.88-1.97-1.97-1.97H6.72l4.52-4.52c.77-.77.77-2.02,0-2.79s-2.02-.77-2.79,0L.58,12.39h0Z"
                    style="fill: #ff5c5c"
                  />
                  <path
                    d="M74.71,3.94h-4.92c-.82,0-1.48-.66-1.48-1.48s.66-1.48,1.48-1.48h4.92c.82,0,1.48.66,1.48,1.48s-.66,1.48-1.48,1.48ZM74.71,6.89c2.28,0,4.16-1.72,4.41-3.94h1.01c.54,0,.98.44.98.98v21.66c0,.54-.44.98-.98.98h-15.75c-.54,0-.98-.44-.98-.98V3.94c0-.54.44-.98.98-.98h1.01c.25,2.22,2.12,3.94,4.41,3.94h4.92ZM78.39,0c-.79-1.19-2.15-1.97-3.69-1.97h-4.92c-1.54,0-2.89.78-3.69,1.97h-1.73c-2.17,0-3.94,1.77-3.94,3.94v21.66c0,2.17,1.77,3.94,3.94,3.94h15.75c2.17,0,3.94-1.77,3.94-3.94V3.94c0-2.17-1.77-3.94-3.94-3.94h-1.73Z"
                    style="fill: #ff5c5c"
                  />
                  <path
                    d="M169.39,9.72l-1.58,11.81h9.64c.46,0,.89.21,1.16.57s.38.82.27,1.27l-1.42,5.65,7.05-10.44h-9.03c-.49,0-.94-.24-1.22-.64s-.33-.92-.16-1.37l2.66-6.85h-7.38ZM166.52,8.91c.16-1.22,1.21-2.14,2.44-2.14h8.53c1.73,0,2.92,1.74,2.3,3.35l-2.14,5.51h7.8c1.98,0,3.14,2.2,2.04,3.84l-12.26,18.15c-.4.6-1.17.81-1.83.52s-1-1.01-.83-1.7l2.98-11.95h-8.31c-1.48,0-2.63-1.31-2.43-2.79,0,0,1.7-12.8,1.7-12.8Z"
                    style="fill: #ff5c5c"
                  />
                  <path
                    d="M131.32,7.32c.81-.23,1.69-.31,2.58-.31h1.72c1.71,0,3.4.26,4.58,1.45s1.45,2.87,1.45,4.58v12.06c0,1.71-.26,3.4-1.45,4.58s-2.87,1.45-4.58,1.45h-22.4c-1.71,0-3.4-.26-4.58-1.45s-1.45-2.87-1.45-4.58v-5.17c0-1.71.26-3.4,1.45-4.58,1.18-1.19,2.87-1.45,4.58-1.45h1.72c.89,0,1.77.07,2.58.31V4.43c0-1.71.26-3.4,1.45-4.58s2.87-1.45,4.58-1.45h1.72c1.71,0,3.4.26,4.58,1.45,1.19,1.18,1.45,2.87,1.45,4.58v2.89ZM120.98,27.69h6.89V4.43c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v23.26ZM117.53,27.69v-7.75c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v5.17c0,1.52.28,1.99.44,2.15s.63.44,2.15.44h4.31ZM131.32,27.69h4.31c1.52,0,1.99-.28,2.15-.44s.44-.63.44-2.15v-12.06c0-1.52-.28-1.99-.44-2.15s-.63-.44-2.15-.44h-1.72c-1.52,0-1.99.28-2.15.44s-.44.63-.44,2.15v14.65Z"
                    style="fill: #ff5c5c"
                  />
                </svg>
              </span>
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

        <button class="bottom-hint-cta" type="button" @click="$router.push('/rules')">
          View point milestones
        </button>
        
      </section>

      <NominateModal
        :open="isNominateOpen"
        :player="selectedPlayer"
        @close="handleCloseNominate"
        @submit="handleSubmitNomination"
      />
    </main>
  </div>
  <VoteNotification />
  <MilestonePopup />
</template>
