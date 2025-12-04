import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import { useCurrentUserStore } from '../stores/useCurrentUserStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})

// Simple auth guard
router.beforeEach((to, from, next) => {
  const currentUserStore = useCurrentUserStore()

  if (to.meta.requiresAuth && !currentUserStore.isLoggedIn) {
    next({ name: 'login' })
  } else if (to.name === 'login' && currentUserStore.isLoggedIn) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
