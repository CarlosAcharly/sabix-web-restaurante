<template>
  <div v-if="!isSupported" class="push-permission not-supported">
    <i class="pi pi-exclamation-triangle"></i>
    <span>Tu navegador no soporta notificaciones push</span>
  </div>
  
  <div v-else-if="permissionStatus === 'granted'" class="push-permission granted">
    <i class="pi pi-check-circle"></i>
    <span>Notificaciones push activas</span>
    <button class="btn-test" @click="sendTestNotification">Enviar prueba</button>
  </div>
  
  <div v-else-if="permissionStatus === 'denied'" class="push-permission denied">
    <i class="pi pi-times-circle"></i>
    <span>Notificaciones bloqueadas</span>
    <button class="btn-enable" @click="openSettings">Configurar</button>
  </div>
  
  <div v-else class="push-permission default">
    <i class="pi pi-bell"></i>
    <span>Activa las notificaciones para recibir alertas en tiempo real</span>
    <button class="btn-enable" @click="requestPermission" :disabled="loading">
      <i class="pi pi-bell" :class="{ 'pi-spin': loading }"></i>
      {{ loading ? 'Activando...' : 'Activar notificaciones' }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import pushService from '@/services/firebase-init';
import { usePushDeviceStore } from '@/stores/push-device';
import { useToast } from 'primevue/usetoast';

const pushStore = usePushDeviceStore();
const toast = useToast();

const loading = ref(false);
const permissionStatus = ref('default');

const isSupported = computed(() => pushService.isSupported());

async function checkPermission() {
  if (!isSupported.value) {
    permissionStatus.value = 'not_supported';
    return;
  }
  
  permissionStatus.value = Notification.permission || 'default';
}

async function requestPermission() {
  if (!isSupported.value) return;
  
  loading.value = true;
  
  try {
    const result = await pushService.requestPermission();
    
    if (result.granted) {
      permissionStatus.value = 'granted';
      await registerDevice();
      toast.add({
        severity: 'success',
        summary: 'Notificaciones activadas',
        detail: 'Recibirás notificaciones en tiempo real',
        life: 3000,
      });
    } else if (result.reason === 'denied') {
      permissionStatus.value = 'denied';
      toast.add({
        severity: 'error',
        summary: 'Notificaciones bloqueadas',
        detail: 'Habilita las notificaciones desde la configuración de tu navegador',
        life: 5000,
      });
    } else {
      toast.add({
        severity: 'info',
        summary: 'Notificaciones no activadas',
        detail: 'Puedes activarlas en cualquier momento',
        life: 3000,
      });
    }
  } catch (error) {
    console.error('Error al solicitar permiso:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudieron activar las notificaciones',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}

async function registerDevice() {
  try {
    const token = await pushService.getFCMToken();
    
    if (token) {
      await pushStore.registerDevice(token, 'web', navigator.userAgent || 'Web Browser');
      console.log('✅ Dispositivo registrado para push notifications');
    }
  } catch (error) {
    console.error('Error registrando dispositivo:', error);
  }
}

function openSettings() {
  if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Edge')) {
    window.open('chrome://settings/content/notifications', '_blank');
  } else if (navigator.userAgent.includes('Firefox')) {
    window.open('about:preferences#privacy', '_blank');
  } else if (navigator.userAgent.includes('Safari')) {
    window.open('safari://settings', '_blank');
  } else {
    toast.add({
      severity: 'info',
      summary: 'Configuración',
      detail: 'Habilita las notificaciones en la configuración de tu navegador',
      life: 3000,
    });
  }
}

function sendTestNotification() {
  if (Notification.permission === 'granted') {
    const notification = new Notification('🔔 Notificación de prueba', {
      body: '¡Has activado correctamente las notificaciones push!',
      icon: '/logo.svg',
    });
    
    setTimeout(() => {
      notification.close();
    }, 5000);
    
    toast.add({
      severity: 'success',
      summary: '¡Notificación enviada!',
      detail: 'Deberías ver una notificación en tu pantalla',
      life: 3000,
    });
  }
}

onMounted(() => {
  checkPermission();
});
</script>

<style scoped>
.push-permission {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.push-permission i {
  font-size: 1.5rem;
}

.push-permission.granted {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #166534;
}

.push-permission.denied {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #991b1b;
}

.push-permission.default {
  background: rgba(126, 9, 126, 0.08);
  border: 1px solid rgba(126, 9, 126, 0.15);
  color: var(--color-primary-2);
}

.push-permission.not-supported {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  color: #92400e;
}

.btn-enable {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-enable:hover:not(:disabled) {
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(126, 9, 126, 0.3);
}

.btn-enable:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-test {
  padding: 0.25rem 0.75rem;
  background: rgba(34, 197, 94, 0.15);
  color: #166534;
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-test:hover {
  background: rgba(34, 197, 94, 0.25);
}
</style>