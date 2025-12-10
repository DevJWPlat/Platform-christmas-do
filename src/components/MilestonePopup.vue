<script setup>
import { ref, watch } from 'vue'
import { usePlayersStore } from '../stores/usePlayersStore'

const playersStore = usePlayersStore()
const showing = ref(false)
const current = ref(null)

const closePopup = () => {
  showing.value = false
  current.value = null
}

watch(
  () => playersStore.milestoneNotifications,
  (queue) => {
    if (!showing.value && queue.length > 0) {
      current.value = queue.shift()
      showing.value = true

      // Auto-close after 8 seconds instead of 5
      setTimeout(() => {
        closePopup()
      }, 8000)
    }
  },
  { deep: true },
)
</script>

<template>
  <div v-if="showing" class="milestone-backdrop">
    <div class="milestone-popup">
      <div class="milestone-header">
        <div class="milestone-icon">🎯</div>
        <h2 class="milestone-title">Milestone Reached!</h2>
      </div>
      <div class="milestone-content">
        <p class="milestone-player">
          <strong>{{ current?.playerName }}</strong> reached
          <span class="milestone-points">{{ current?.points }} points</span>
        </p>
        <div class="milestone-consequence">
          <p class="milestone-label">Consequence:</p>
          <p class="milestone-action">{{ current?.action }}</p>
        </div>
      </div>
      <button class="milestone-close" @click="closePopup">Got it</button>
    </div>
  </div>
</template>



<style scoped>
.milestone-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.milestone-popup {
  position: relative;
  width: 100%;
  max-width: 400px;
  background: radial-gradient(circle at top, #1e1e2e 0, #151520 60%);
  border: 2px solid var(--accent);
  border-radius: var(--radius-xl);
  padding: 24px;
  text-align: center;
  color: var(--text-main);
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(255, 75, 129, 0.3);
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.milestone-header {
  margin-bottom: 20px;
}

.milestone-icon {
  font-size: 48px;
  margin-bottom: 8px;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.milestone-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--accent);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.milestone-content {
  margin-bottom: 20px;
}

.milestone-player {
  font-size: 18px;
  margin-bottom: 16px;
  font-weight: 500;
}

.milestone-player strong {
  color: var(--accent);
  font-weight: 700;
  font-size: 20px;
}

.milestone-points {
  color: var(--accent);
  font-weight: 700;
  font-size: 20px;
}

.milestone-consequence {
  background: rgba(255, 75, 129, 0.15);
  border: 1px solid rgba(255, 75, 129, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
}

.milestone-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.milestone-action {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  font-style: italic;
}

.milestone-close {
  width: 100%;
  padding: 12px 20px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  background: radial-gradient(circle at left, rgba(255, 75, 129, 0.5), rgba(20, 20, 30, 0.95));
  color: var(--text-main);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.milestone-close:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(255, 75, 129, 0.4);
}

.milestone-close:active {
  transform: scale(0.98);
}
</style>
