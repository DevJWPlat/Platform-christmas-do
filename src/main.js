import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/main.scss'

import App from './App.vue'
import router from './router'

try {
  const app = createApp(App)

  app.use(createPinia())
  app.use(router)

  app.mount('#app')
} catch (error) {
  console.error('Failed to initialize app:', error)
  document.getElementById('app').innerHTML = `
    <div style="padding: 20px; color: white; background: #1a1a2e; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h1>Error loading app</h1>
      <p>${error.message}</p>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">Check the console for more details</p>
    </div>
  `
}
