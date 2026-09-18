<template>
  <div class="settings">
    <h1>Configuración</h1>
    <p>Panel de configuración del restaurante</p>
    <div class="settings-card">
      <p>Próximamente...</p>
    </div>
  </div>
</template>

<script setup>
console.log('Settings loaded');
</script>

<style scoped>
.settings {
  padding: 1rem;
}

.settings h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.settings p {
  color: #6b7280;
  margin: 0 0 2rem;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>