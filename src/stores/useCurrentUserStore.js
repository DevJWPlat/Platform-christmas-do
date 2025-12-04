// src/stores/useCurrentUserStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCurrentUserStore = defineStore('currentUser', () => {
  const user = ref(null)

  const isLoggedIn = computed(() => !!user.value)

  function login(selectedUser) {
    user.value = selectedUser
  }

  function logout() {
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
  }
})
