<template>
  <Transition name="offline-slide">
    <div v-if="isOffline" class="offline-banner" role="status" aria-live="assertive">
      <i class="pi pi-wifi" aria-hidden="true"></i>
      <span>Sin conexión a internet</span>
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const isOffline = ref(!navigator.onLine);

function updateConnectionStatus() {
  isOffline.value = !navigator.onLine;
}

onMounted(() => {
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateConnectionStatus);
  window.removeEventListener('offline', updateConnectionStatus);
});
</script>

<style scoped>
.offline-banner {
  position: fixed;
  z-index: 1300;
  inset: 0 0 auto;
  display: flex;
  min-height: 2.8rem;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.65rem 1rem;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  background: #b42318;
  box-shadow: 0 3px 12px rgb(0 0 0 / 16%);
}

.offline-slide-enter-active,
.offline-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.25s ease;
}

.offline-slide-enter-from,
.offline-slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
