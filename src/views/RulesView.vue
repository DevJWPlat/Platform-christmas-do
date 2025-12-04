<script setup>
const rules = [
  { points: 1, action: "Take a shot" },
  { points: 5, action: "Take a shot" },
  { points: 10, action: "Down your drink" },
  { points: 15, action: "The team will create you a forfeit / rule" },
  { points: 20, action: "Buy a round" },
  { points: 25, action: "Take a shot" },
]
</script>

<template>
  <div class="app-shell">
    
    <header class="app-header">
      <div class="app-header-left">
        <div class="logo-pill">P</div>
        <div class="app-title">
          <span class="app-title-main">Points Rules</span>
          <span class="app-title-sub">Forfeits & milestones</span>
        </div>
      </div>

      <router-link class="icon-button" to="/home">←</router-link>
    </header>

    <main class="app-main rules-page">
      
      <p class="rules-intro">
        These are the official forfeit milestones.  
        As soon as your points reach any of these values,  
        <strong>you must immediately perform the forfeit.</strong>
      </p>

      <div class="rules-list">
        <div 
          v-for="rule in rules" 
          :key="rule.points" 
          class="rule-card"
        >
          <div class="rule-points">{{ rule.points }} pts</div>
          <div class="rule-action">{{ rule.action }}</div>
        </div>
      </div>

    </main>

  </div>
</template>

<style scoped>
.rules-intro {
  margin: 20px 0;
  font-size: 1rem;
  opacity: 0.9;
  line-height: 1.4;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-card {
  background: rgba(255,255,255,0.05);
  padding: 16px;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-points {
  font-size: 1.1rem;
  font-weight: 600;
}

.rule-action {
  opacity: 0.8;
}
</style>
