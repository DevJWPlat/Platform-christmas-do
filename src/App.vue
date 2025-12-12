<script setup>
import { RouterView } from 'vue-router'
import MilestonePopup from './components/MilestonePopup.vue'
</script>

<template>
  <!-- Each view includes its own app-shell, so App.vue can be simple -->
  <RouterView />
  <VoteNotification />
  <MilestonePopup />
</template>
