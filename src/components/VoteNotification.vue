<script setup>
  import { ref, watch, computed, onMounted } from 'vue'
  import { useVotesStore } from '../stores/useVotesStore'
  import { useCurrentUserStore } from '../stores/useCurrentUserStore'
  
  const votesStore = useVotesStore()
  const currentUserStore = useCurrentUserStore()
  const currentUserId = computed(() => currentUserStore.user?.id || null)
  
  const showing = ref(false)
  const current = ref(null)
  const busy = ref(false)
  
  const showNext = () => {
    while (votesStore.nominationNotifications.length > 0) {
      const next = votesStore.nominationNotifications.shift()
  
      // Do not show popup to the person who created the nomination
      if (next?.createdById && next.createdById === currentUserId.value) {
        continue
      }
  
      current.value = next
      showing.value = true
      return
    }
  
    showing.value = false
    current.value = null
  }
  
  const accept = async () => {
    if (!current.value) return
    busy.value = true
    try {
      await votesStore.acceptNomination(current.value.id)
      showNext()
    } catch (e) {
      console.error('Vote action failed:', e)
      alert(e?.message || JSON.stringify(e))
    } finally {
      busy.value = false
    }
  }
  
  const decline = async () => {
    if (!current.value) return
    busy.value = true
    try {
      await votesStore.declineNomination(current.value.id)
      showNext()
    } catch (e) {
      console.error('Vote action failed:', e)
      alert(e?.message || JSON.stringify(e))
    } finally {
      busy.value = false
    }
  }
  
  // Watch LENGTH (more reliable than watching the array object)
  watch(
    () => votesStore.nominationNotifications.length,
    (len) => {
      console.log('[VoteNotification] queue length changed:', len)
      if (!showing.value) showNext()
    },
  )
  
  onMounted(() => {
    console.log('[VoteNotification] mounted. currentUserId:', currentUserId.value)
    if (!showing.value) showNext()
  })
  </script>
  
  <template>
    <div v-if="showing" class="vote-backdrop">
      <div class="vote-popup">
        <h2 class="vote-title">New nomination</h2>
  
        <p class="vote-subtitle">
          <strong>{{ current?.createdByName || 'Someone' }}</strong>
          nominated
          <strong>{{ current?.targetName || 'someone' }}</strong>
        </p>
  
        <p class="vote-reason">
          <strong>Reason:</strong><br />
          {{ current?.reason || 'No reason given' }}
        </p>
  
        <div class="vote-actions">
          <button class="btn ghost" :disabled="busy" @click="decline">Decline</button>
          <button class="btn primary" :disabled="busy" @click="accept">Accept</button>
        </div>
      </div>
    </div>
  </template>
  
  <style scoped>
  .vote-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    z-index: 110;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .vote-popup {
    width: 100%;
    max-width: 420px;
    background: radial-gradient(circle at top, #1e1e2e 0, #151520 60%);
    border: 2px solid var(--accent);
    border-radius: var(--radius-xl);
    padding: 22px;
    color: var(--text-main);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.9);
  }
  
  .vote-title {
    margin: 0 0 10px 0;
    color: var(--accent);
    font-size: 20px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  
  .vote-subtitle {
    margin: 0 0 14px 0;
    opacity: 0.95;
  }
  
  .vote-reason {
    margin: 0 0 16px 0;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 12px;
  }
  
  .vote-actions {
    display: flex;
    gap: 10px;
  }
  
  .btn {
    flex: 1;
    padding: 12px 14px;
    border-radius: 999px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    color: var(--text-main);
  }
  
  .btn.primary {
    border-color: var(--accent);
    background: radial-gradient(circle at left, rgba(255, 75, 129, 0.5), rgba(20, 20, 30, 0.95));
  }
  
  .btn.ghost {
    background: rgba(255, 255, 255, 0.06);
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  </style>
  