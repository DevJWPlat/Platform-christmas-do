<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'

const router = useRouter()
const currentUserStore = useCurrentUserStore()

const rules = [
  { points: 1, action: 'Take a shot' },
  { points: 5, action: 'Take a shot' },
  { points: 10, action: 'Down your drink' },
  { points: 15, action: 'The team will create you a forfeit / rule' },
  { points: 20, action: 'Buy a round' },
  { points: 25, action: 'Take a shot' },
]

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

const logout = () => {
  currentUserStore.logout()
  closeMenu()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="app-header-left">
        <router-link :to="{ name: 'home' }" class="logo-pill">
          <img src="/logo.svg" alt="Logo" class="logo-img" />
        </router-link>
        <div class="app-title">
          <span class="app-title-main">Points Rules</span>
          <span class="app-title-sub">Forfeits & milestones</span>
        </div>
      </div>

      <button class="icon-button" type="button" @click="toggleMenu">
        <span></span>
      </button>
    </header>

    <!-- Hamburger Menu -->
    <div v-if="isMenuOpen" class="menu-backdrop" @click="closeMenu">
      <div class="menu-panel" @click.stop>
        <div class="menu-header">
          <h3 class="menu-title">Menu</h3>
          <button class="menu-close" @click="closeMenu">✕</button>
        </div>

        <nav class="menu-nav">
          <button class="menu-item" @click="navigateTo('/home')">
            <span class="menu-item-icon">🏠</span>
            <span class="menu-item-text">Leaderboard</span>
          </button>

          <button class="menu-item" @click="navigateTo('/feed')">
            <span class="menu-item-icon">📰</span>
            <span class="menu-item-text">Activity Feed</span>
          </button>

          <button class="menu-item" @click="navigateTo('/rules')">
            <span class="menu-item-icon">📋</span>
            <span class="menu-item-text">Points Rules</span>
          </button>

          <div class="menu-divider"></div>

          <button class="menu-item menu-item-danger" @click="logout">
            <span class="menu-item-icon">🚪</span>
            <span class="menu-item-text">Logout</span>
          </button>
        </nav>
      </div>
    </div>

    <main class="app-main rules-page">
      <p class="rules-intro">
        These are the official forfeit milestones. As soon as your points reach any of these values,
        <strong>you must immediately perform the forfeit.</strong>
      </p>

      <div class="rules-list">
        <div v-for="rule in rules" :key="rule.points" class="rule-card">
          <div class="rule-points">{{ rule.points }} pts</div>
          <div class="rule-action">{{ rule.action }}</div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.rules-intro {
  margin: 20px 0;
  font-size: 1rem;
  color: var(--text-muted);
  line-height: 1.5;
  font-weight: 500;
}

.rules-intro strong {
  color: var(--text-main);
  font-weight: 600;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-subtle);
  padding: 16px;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-points {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
}

.rule-action {
  color: var(--text-muted);
  font-weight: 500;
}
</style>
