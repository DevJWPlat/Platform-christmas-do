import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RulesView from '../views/RulesView.vue'
import FeedView from '../views/FeedView.vue'
import NotFoundView from '../views/NotFoundView.vue'
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
    {
      path: '/rules',
      name: 'rules',
      component: RulesView,
      meta: { requiresAuth: true },
    },
    {
      path: '/feed',
      name: 'feed',
      component: FeedView,
      meta: { requiresAuth: true },
    },
    // Catch-all 404 route - must be last
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

// Simple auth guard
router.beforeEach((to, from, next) => {
  try {
    const currentUserStore = useCurrentUserStore()

    if (to.meta.requiresAuth && !currentUserStore.isLoggedIn) {
      next({ name: 'login' })
    } else if (to.name === 'login' && currentUserStore.isLoggedIn) {
      next({ name: 'home' })
    } else {
      next()
    }
  } catch (error) {
    console.error('Router error:', error)
    // Fallback to login if there's an error
    if (to.name !== 'login') {
      next({ name: 'login' })
    } else {
      next()
    }
  }
})

export default router
