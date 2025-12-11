// src/stores/useCurrentUserStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'currentUser'

// Load user from localStorage on initialization
function loadUserFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error('Error loading user from storage:', error)
    return null
  }
}

// Save user to localStorage
function saveUserToStorage(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (error) {
    console.error('Error saving user to storage:', error)
  }
}

export const useCurrentUserStore = defineStore('currentUser', () => {
  // Initialize from localStorage
  const user = ref(loadUserFromStorage())

  const isLoggedIn = computed(() => !!user.value)

  function login(selectedUser) {
    user.value = selectedUser
    saveUserToStorage(selectedUser)
  }

  function logout() {
    user.value = null
    saveUserToStorage(null)
  }

  return {
    user,
    isLoggedIn,
    login,
    logout,
  }
})
