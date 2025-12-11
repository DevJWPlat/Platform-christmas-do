<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'
import { supabase } from '../supabaseClient'
import { usePlayersStore } from '../stores/usePlayersStore'
import { useRouter } from 'vue-router'
import { getPlayerImage } from '../utils/playerImages'

const router = useRouter()
const currentUserStore = useCurrentUserStore()
const currentUser = computed(() => currentUserStore.user)
const playersStore = usePlayersStore()

const feedItems = ref([])
const loading = ref(false)
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

const loadFeed = async () => {
  loading.value = true
  
  // Get all approved votes with player names
  const { data: votes, error } = await supabase
    .from('votes')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error loading feed:', error)
    loading.value = false
    return
  }

  // Decorate votes with player names
  feedItems.value = votes.map(vote => {
    const target = playersStore.players.find(p => p.id === vote.target_id)
    const creator = playersStore.players.find(p => p.id === vote.created_by_id)
    
    return {
      ...vote,
      targetName: target?.name || 'Unknown',
      creatorName: creator?.name || 'Unknown',
      createdAt: new Date(vote.created_at),
    }
  })

  loading.value = false
}

const formatTime = (date) => {
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

onMounted(() => {
  // Load players first so we can match names
  playersStore.loadPlayers().then(() => {
    loadFeed()
  })
})
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
            <span class="app-title-main">Activity Feed</span>
            <span class="app-title-sub">Who got points and why</span>
          </div>
        </div>

        <button class="icon-button" type="button" @click="toggleMenu">
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
            <button 
              class="menu-item" 
              @click="navigateTo('/home')"
            >
              <span class="menu-item-icon">📊</span>
              <span class="menu-item-text">Leaderboard</span>
            </button>
            
            <button 
              class="menu-item" 
              @click="navigateTo('/feed')"
            >
              <span class="menu-item-icon">⚡</span>
              <span class="menu-item-text">Activity Feed</span>
            </button>
            
            <button 
              class="menu-item" 
              @click="navigateTo('/rules')"
            >
              <span class="menu-item-icon">📜</span>
              <span class="menu-item-text">Points Rules</span>
            </button>
            
            <div class="menu-divider"></div>
            
            <button 
              class="menu-item menu-item-danger logout" 
              @click="logout"
            >
              <span class="menu-item-icon">↩️</span>
              <span class="menu-item-text">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </Transition>

    <main class="app-main feed-page">
      <div v-if="loading" class="feed-loading">
        Loading feed...
      </div>

      <div v-else-if="feedItems.length === 0" class="feed-empty">
        <p>No activity yet. Be the first to nominate someone!</p>
      </div>

      <div v-else class="feed-list">
        <div 
          v-for="item in feedItems" 
          :key="item.id" 
          class="feed-item"
        >
          <div class="feed-item-header">
            <div class="feed-item-avatar">
              <img 
                v-if="getPlayerImage(item.targetName)" 
                :src="getPlayerImage(item.targetName)" 
                :alt="item.targetName"
                class="feed-item-avatar-img"
              />
              <span v-else class="feed-item-avatar-fallback">
                {{ item.targetName.charAt(0) }}
              </span>
            </div>
            <div class="feed-item-info">
              <div class="feed-item-title">
                <strong>{{ item.targetName }}</strong> got a point
              </div>
              <div class="feed-item-meta">
                Nominated by {{ item.creatorName }} • {{ formatTime(item.createdAt) }}
              </div>
            </div>
          </div>
          
          <div class="feed-item-reason">
            "{{ item.reason }}"
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.feed-page {
  padding-top: 8px;
}

.feed-loading,
.feed-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 500;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feed-item {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 14px;
  transition: background 0.2s ease;
}

.feed-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.feed-item-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.feed-item-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: radial-gradient(circle at top, #fff 0, #ff4b81 20%, #5715ff 60%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #050509;
  flex-shrink: 0;
  font-size: 14px;
  overflow: hidden;
  position: relative;
}

.feed-item-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 999px;
}

.feed-item-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.feed-item-info {
  flex: 1;
}

.feed-item-title {
  font-size: 14px;
  color: var(--text-main);
  margin-bottom: 4px;
  font-weight: 500;
}

.feed-item-title strong {
  color: var(--accent);
  font-weight: 600;
}

.feed-item-meta {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}

.feed-item-reason {
  font-size: 13px;
  color: var(--text-main);
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid var(--border-subtle);
  font-style: italic;
  margin-top: 8px;
  font-weight: 500;
}
</style>

