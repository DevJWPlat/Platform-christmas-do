<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push({ name: 'home' })
}

const goLogin = () => {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-shell">
    <main class="app-main not-found-page">
      <div class="not-found-content">
        <div class="not-found-icon">404</div>
        <h1 class="not-found-title">Page Not Found</h1>
        <p class="not-found-message">
          Oops! The page you're looking for doesn't exist.
        </p>
        <div class="not-found-actions">
          <button class="not-found-button primary" @click="goHome">
            Go to Leaderboard
          </button>
          <button class="not-found-button secondary" @click="goLogin">
            Go to Login
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.not-found-content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.not-found-icon {
  font-size: 120px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  margin-bottom: 20px;
  opacity: 0.8;
}

.not-found-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-main);
  margin: 0 0 12px 0;
}

.not-found-message {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.not-found-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.not-found-button {
  padding: 14px 24px;
  border-radius: 999px;
  border: 1px solid var(--accent);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.not-found-button.primary {
  background: radial-gradient(
    circle at left,
    rgba(255, 75, 129, 0.5),
    rgba(20, 20, 30, 0.95)
  );
  color: var(--text-main);
}

.not-found-button.primary:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(255, 75, 129, 0.4);
}

.not-found-button.primary:active {
  transform: scale(0.98);
}

.not-found-button.secondary {
  background: transparent;
  color: var(--text-main);
  border-color: var(--border-subtle);
}

.not-found-button.secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--accent);
}

.not-found-button.secondary:active {
  transform: scale(0.98);
}
</style>

