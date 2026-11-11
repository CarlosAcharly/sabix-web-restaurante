<template>
  <div id="app">
    <router-view />
    <InstallPWA />
    <OfflineIndicator />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import InstallPWA from './components/pwa/InstallPWA.vue';
import OfflineIndicator from './components/pwa/OfflineIndicator.vue';

const authStore = useAuthStore();

onMounted(() => {
  // Verificar sesión al cargar la app
  authStore.checkAuth();
  console.log('✅ App montada correctamente');
});
</script>

<style>
/* ============================================
   RESET Y ESTILOS BASE
   ============================================ */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f4f0f7;
  min-height: 100vh;
  color: #1a1a2e;
}

#app {
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f4f0f7;
}

/* ============================================
   SELECCIÓN DE TEXTO
   ============================================ */
::selection {
  background: var(--color-primary-3);
  color: white;
}

::-moz-selection {
  background: var(--color-primary-3);
  color: white;
}

/* ============================================
   ANIMACIONES GLOBALES
   ============================================ */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.fade-in {
  animation: fadeIn 0.4s ease forwards;
}

.slide-up {
  animation: slideUp 0.5s ease forwards;
}

/* ============================================
   CLASES DE UTILIDAD
   ============================================ */
.text-center {
  text-align: center;
}

.text-muted {
  color: #6b7280;
}

.text-primary {
  color: var(--color-primary-2);
}

.text-success {
  color: #22c55e;
}

.text-danger {
  color: #ef4444;
}

.text-warning {
  color: #f59e0b;
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-5 { gap: 1.5rem; }
.gap-6 { gap: 2rem; }

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-5 { margin-top: 1.5rem; }
.mt-6 { margin-top: 2rem; }

.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.5rem; }
.mb-6 { margin-bottom: 2rem; }

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.rounded {
  border-radius: var(--glass-radius);
}

.shadow {
  box-shadow: var(--glass-shadow);
}

/* ============================================
   OVERRIDES DE PRIMEVUE
   ============================================ */
.p-component {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.p-button {
  border-radius: 10px !important;
}

.p-button.p-button-primary {
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%) !important;
  border: none !important;
}

.p-button.p-button-primary:hover {
  opacity: 0.9 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(126, 9, 126, 0.3);
}

.p-inputtext:enabled:focus {
  border-color: var(--color-primary-3) !important;
  box-shadow: 0 0 0 3px rgba(188, 74, 185, 0.15) !important;
}

.p-dropdown:not(.p-disabled).p-focus {
  border-color: var(--color-primary-3) !important;
  box-shadow: 0 0 0 3px rgba(188, 74, 185, 0.15) !important;
}

/* ============================================
   RESPONSIVE GLOBAL
   ============================================ */
@media (max-width: 768px) {
  .hide-mobile {
    display: none !important;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .hide-tablet {
    display: none !important;
  }
}

@media (min-width: 1025px) {
  .hide-desktop {
    display: none !important;
  }
}
</style>