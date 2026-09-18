<template>
  <div class="not-found">
    <div class="not-found-content">
      <i class="pi pi-exclamation-circle"></i>
      <h1>404</h1>
      <h2>Página no encontrada</h2>
      <p>La página que buscas no existe o ha sido movida.</p>
      <Button label="Volver al Inicio" icon="pi pi-home" @click="$router.push('/')" />
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button';
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.not-found-content {
  text-align: center;
  padding: 2rem;
}

.not-found-content i {
  font-size: 4rem;
  color: #f59e0b;
  display: block;
  margin-bottom: 1rem;
}

.not-found-content h1 {
  font-size: 6rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.not-found-content h2 {
  font-size: 1.5rem;
  color: #374151;
  margin: 0.5rem 0;
}

.not-found-content p {
  color: #6b7280;
  margin-bottom: 2rem;
}
</style>