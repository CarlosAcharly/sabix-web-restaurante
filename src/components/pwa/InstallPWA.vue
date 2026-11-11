<template>
  <Transition name="install-banner">
    <aside v-if="showBanner" class="install-banner" aria-label="Instalar Sabix Delivery">
      <div class="install-copy">
        <span class="install-icon pi pi-mobile" aria-hidden="true"></span>
        <div>
          <strong>Instala Sabix Delivery</strong>
          <p>Accede más rápido desde tu dispositivo.</p>
        </div>
      </div>
      <div class="install-actions">
        <button class="install-button" type="button" @click="installApp">Instalar</button>
        <button class="dismiss-button" type="button" aria-label="Cerrar aviso" @click="dismissBanner">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const dismissalKey = 'pwa-install-dismissed';
const dismissalDuration = 7 * 24 * 60 * 60 * 1000;
const showBanner = ref(false);
let deferredPrompt = null;

function handleBeforeInstallPrompt(event) {
  event.preventDefault();
  deferredPrompt = event;

  try {
    const dismissedAt = Number(localStorage.getItem(dismissalKey));
    if (!dismissedAt || Date.now() - dismissedAt >= dismissalDuration) {
      showBanner.value = true;
    }
  } catch {
    showBanner.value = true;
  }
}

async function installApp() {
  if (!deferredPrompt) return;

  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  showBanner.value = false;
  deferredPrompt = null;
}

function dismissBanner() {
  showBanner.value = false;
  try {
    localStorage.setItem(dismissalKey, String(Date.now()));
  } catch {
    // El aviso se oculta durante esta sesión aunque el almacenamiento no esté disponible.
  }
}

function handleAppInstalled() {
  showBanner.value = false;
  deferredPrompt = null;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
});
</script>

<style scoped>
.install-banner {
  position: fixed;
  z-index: 1200;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  left: max(1rem, env(safe-area-inset-left));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 34rem;
  margin-inline: auto;
  padding: 1rem 1.1rem;
  color: #fff;
  background: linear-gradient(120deg, var(--color-primary-2), var(--color-primary-4));
  border-radius: 12px;
  box-shadow: 0 12px 32px rgb(34 18 42 / 28%);
  animation: slideUp 0.35s ease both;
}

.install-copy,
.install-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.install-icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  font-size: 1.25rem;
  background: rgb(255 255 255 / 18%);
  border-radius: 8px;
}

.install-copy strong {
  display: block;
  font-size: 0.95rem;
}

.install-copy p {
  margin-top: 0.2rem;
  font-size: 0.8rem;
  line-height: 1.35;
  color: rgb(255 255 255 / 88%);
}

.install-actions {
  flex: 0 0 auto;
}

.install-button,
.dismiss-button {
  color: #fff;
  cursor: pointer;
  border: 0;
}

.install-button {
  padding: 0.65rem 0.9rem;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
  background: rgb(255 255 255 / 18%);
  border-radius: 7px;
}

.install-button:hover {
  background: rgb(255 255 255 / 28%);
}

.dismiss-button {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  font-size: 0.9rem;
  background: transparent;
  border-radius: 6px;
}

.dismiss-button:hover {
  background: rgb(255 255 255 / 16%);
}

.install-button:focus-visible,
.dismiss-button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 3px;
}

.install-banner-enter-active,
.install-banner-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.install-banner-enter-from,
.install-banner-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

@media (max-width: 420px) {
  .install-banner {
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.85rem;
  }

  .install-copy,
  .install-actions {
    gap: 0.55rem;
  }

  .install-button {
    padding-inline: 0.7rem;
  }
}
</style>
