<script setup>
import { ref, watch } from 'vue'
import { usePlayersStore } from '../stores/usePlayersStore'

const playersStore = usePlayersStore()
const showing = ref(false)
const current = ref(null)

watch(
  () => playersStore.milestoneNotifications,
  (queue) => {
    if (!showing.value && queue.length > 0) {
      current.value = queue.shift()
      showing.value = true

      setTimeout(() => {
        showing.value = false
        current.value = null
      }, 5000)
    }
  },
  { deep: true }
)
</script>

<template>
  <div 
    v-if="showing" 
    class="milestone-popup"
  >
    <h3>{{ current.playerName }} reached {{ current.points }} points!</h3>
    <p>{{ current.action }}</p>
  </div>
</template>

<style scoped>
.milestone-popup {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  padding: 16px 22px;
  border-radius: 14px;
  text-align: center;
  color: white;
  animation: pop 0.3s ease;
}

@keyframes pop {
  from { transform: translateX(-50%) scale(0.8); opacity: 0 }
  to { transform: translateX(-50%) scale(1); opacity: 1 }
}
</style>
