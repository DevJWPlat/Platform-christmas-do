<!-- src/components/NominateModal.vue -->
<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  player: {
    type: Object,
    default: null,
  },
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'submit'])

const reason = ref('')

watch(
  () => props.open,
  (val) => {
    if (val) {
      reason.value = ''
    }
  }
)

const handleSubmit = () => {
  if (!reason.value.trim()) {
    // You can add a nicer validation later
    return
  }
  emit('submit', {
    playerId: props.player.id,
    reason: reason.value.trim(),
  })
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
    <div v-if="open" class="modal-backdrop" @click.self="handleClose">
        <div class="modal-panel">
        <header class="modal-header">
            <div class="modal-title-group">
            <p class="modal-title">
                Nominate
                <span v-if="player" class="modal-title-highlight">
                {{ player.name }}
                </span>
                for a point
            </p>
            <p class="modal-subtitle">
                Everyone will get 10 minutes to agree or disagree.
            </p>
            </div>
            <button
            type="button"
            class="modal-close"
            aria-label="Close nomination"
            @click="handleClose"
            >
            ✕
            </button>
        </header>

        <div class="modal-body">
            <label class="modal-label" for="reason">
            What did they do to deserve this?
            </label>
            <textarea
            id="reason"
            v-model="reason"
            class="modal-textarea"
            rows="4"
            placeholder="Example: Spilled a drink over themselves again"
            ></textarea>
        </div>

        <footer class="modal-footer">
            <button
            type="button"
            class="modal-button secondary"
            @click="handleClose"
            >
            Cancel
            </button>
            <button
            type="button"
            class="modal-button primary"
            @click="handleSubmit"
            >
            Submit nomination
            </button>
        </footer>
        </div>
    </div>
</template>
