<script setup>
import { ref, watch, onMounted } from 'vue'
import { useVotesStore } from '../stores/useVotesStore'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'

const votesStore = useVotesStore()
const currentUserStore = useCurrentUserStore()

const currentVote = ref(null)

const loadNext = () => {
  currentVote.value = votesStore.popNextNotification()
}

onMounted(() => {
  loadNext()
})

// when queue length changes and nothing is open, open next
watch(
  () => votesStore.pendingNotifications.length,
  (len) => {
    if (len > 0 && !currentVote.value) {
      loadNext()
    }
  }
)

const handleRespond = async (response) => {
  if (!currentVote.value || !currentUserStore.user) return

  await votesStore.respondToVote(
    currentVote.value.id,
    response,
    currentUserStore.user.id
  )
  await votesStore.resolveExpiredVotes()


  // close this one and load next
  loadNext()
}
</script>

<template>
  <div
    v-if="currentVote"
    class="modal-backdrop"
  >
    <div class="modal-panel">
      <header class="modal-header">
        <div class="modal-title-group">
          <p class="modal-title">
            {{ currentVote.creatorName }} nominated
            <span class="modal-title-highlight">
              {{ currentVote.targetName }}
            </span>
            for a point
          </p>
          <p class="modal-subtitle">
            Do you agree this deserves a point?
          </p>
        </div>
      </header>

      <div class="modal-body">
        <label class="modal-label">
          Reason
        </label>
        <div class="modal-reason">
          “{{ currentVote.reason }}”
        </div>
      </div>

      <footer class="modal-footer">
        <button
          type="button"
          class="modal-button secondary"
          @click="handleRespond('disagree')"
        >
          Disagree
        </button>
        <button
          type="button"
          class="modal-button primary"
          @click="handleRespond('agree')"
        >
          Agree
        </button>
      </footer>
    </div>
  </div>
</template>
