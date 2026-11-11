import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css';
import { registerSW } from 'virtual:pwa-register';

// Estilos globales
import './assets/styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.p-dark',
    },
  },
});
app.use(ToastService);

app.mount('#app');

console.log('✅ Sabix Delivery - App iniciada correctamente');

// ============================================
// REGISTRAR SERVICE WORKER PARA PUSH NOTIFICATIONS
// ============================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('✅ Service Worker registrado:', registration);
    })
    .catch((error) => {
      console.error('❌ Error al registrar Service Worker:', error);
    });
}

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 Nueva versión disponible');
    if (confirm('Hay una nueva versión disponible. ¿Actualizar ahora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ App lista para funcionar offline');
  },
  onRegistered(registration) {
    console.log('✅ PWA Service Worker registrado:', registration);
  },
  onRegisterError(error) {
    console.error('❌ Error al registrar PWA Service Worker:', error);
  },
});