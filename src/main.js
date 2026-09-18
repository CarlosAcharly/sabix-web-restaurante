import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css';

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