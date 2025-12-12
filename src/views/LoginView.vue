<script setup>
import { ref, onMounted } from 'vue'
import { usePlayersStore } from '../stores/usePlayersStore'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'
import { useRouter } from 'vue-router'
import { supabase } from '../supabaseClient'
import { getPlayerImage } from '../utils/playerImages'

const playersStore = usePlayersStore()
const currentUserStore = useCurrentUserStore()
const router = useRouter()

const selectedPlayer = ref(null)
const password = ref('')
const passwordError = ref('')
const isPasswordModalOpen = ref(false)

// ✅ load players from Supabase when this view mounts
onMounted(async () => {
  if (currentUserStore.isLoggedIn) {
    router.push({ name: 'home' })
    return
  }

  // works no matter what the store exposes
  if (playersStore.initPlayers) await playersStore.initPlayers()
  else if (playersStore.loadPlayers) await playersStore.loadPlayers()
})


const selectUser = (player) => {
  selectedPlayer.value = player
  password.value = ''
  passwordError.value = ''
  isPasswordModalOpen.value = true
}

const closePasswordModal = () => {
  isPasswordModalOpen.value = false
  selectedPlayer.value = null
  password.value = ''
  passwordError.value = ''
}

const handleLogin = async () => {
  if (!selectedPlayer.value || !password.value.trim()) {
    passwordError.value = 'Please enter your password'
    return
  }

  passwordError.value = ''

  // Fetch player with password from database
  const { data, error } = await supabase
    .from('players')
    .select('id, name, password')
    .eq('id', selectedPlayer.value.id)
    .single()

  if (error) {
    console.error('Error fetching player:', error)
    passwordError.value = 'Error verifying password. Please try again.'
    return
  }

  // Compare passwords (assuming passwords are stored in plain text for simplicity)
  // For production, you'd want to hash passwords, but for a low-security app this is fine
  if (data.password === password.value.trim()) {
    currentUserStore.login({
      id: data.id,
      name: data.name,
    })
    closePasswordModal()
    router.push({ name: 'home' })
  } else {
    passwordError.value = 'Incorrect password. Please try again.'
    password.value = ''
  }
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="wrapper">
        <div class="app-header-left">
          <div class="logo-pill">
            <img src="/logo.svg" alt="Logo" class="logo-img" />
          </div>
          <div class="app-title">
            <span class="app-title-main">Who are you?</span>
            <span class="app-title-sub">Tap your name to join the game</span>
          </div>
        </div>
      </div>
    </header>

    <main class="app-main">
      <section>
        <div class="section-header">
          <div>
            <h1 class="section-title">Choose your profile</h1>
            <p class="section-tagline">Tap your name and enter your password</p>
          </div>
        </div>

        <!-- simple loading state -->
        <p v-if="playersStore.loading" class="section-tagline">Loading players…</p>

        <div v-else class="player-list">
          <button
            v-for="player in playersStore.players"
            :key="player.id"
            type="button"
            class="player-card"
            @click="selectUser(player)"
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
                <span class="player-tag"> Tap to log in </span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <!-- Password Modal -->
      <div v-if="isPasswordModalOpen" class="modal-backdrop" @click.self="closePasswordModal">
        <div class="modal-panel">
          <header class="modal-header">
            <div class="modal-title-group">
              <p class="modal-title">
                Enter password for
                <span v-if="selectedPlayer" class="modal-title-highlight">
                  {{ selectedPlayer.name }}
                </span>
              </p>
              <p class="modal-subtitle">Please enter your password to continue</p>
            </div>
            <button
              type="button"
              class="modal-close"
              aria-label="Close"
              @click="closePasswordModal"
            >
              ✕
            </button>
          </header>

          <div class="modal-body">
            <label class="modal-label" for="password"> Password </label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="modal-input"
              placeholder="Enter your password"
              @keyup.enter="handleLogin"
            />
            <p v-if="passwordError" class="password-error">
              {{ passwordError }}
            </p>
          </div>

          <footer class="modal-footer">
            <button type="button" class="modal-button secondary" @click="closePasswordModal">
              Cancel
            </button>
            <button type="button" class="modal-button primary" @click="handleLogin">Log in</button>
          </footer>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.password-error {
  color: var(--danger);
  font-size: 12px;
  margin-top: 6px;
}

.modal-input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--border-subtle);
  background: rgba(10, 10, 18, 0.95);
  color: var(--text-main);
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
}

.modal-input:focus {
  border-color: rgba(255, 75, 129, 0.8);
  box-shadow: 0 0 0 1px rgba(255, 75, 129, 0.5);
}
</style>
