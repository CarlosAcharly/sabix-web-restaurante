<template>
  <div class="devices-view">
    <div class="page-header">
      <div>
        <h1>Dispositivos</h1>
        <p class="subtitle">Gestiona los dispositivos que reciben tus notificaciones</p>
      </div>
      <button class="btn-refresh" @click="refresh" :disabled="loading">
        <i class="pi pi-refresh" :class="{ 'pi-spin': loading }"></i>
        Actualizar
      </button>
    </div>

    <!-- Push Permission -->
    <PushPermission />

    <!-- Lista de dispositivos -->
    <div class="devices-list">
      <h2>Dispositivos registrados</h2>
      
      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando dispositivos...</span>
      </div>
      
      <div v-else-if="devices.length === 0" class="empty-state">
        <i class="pi pi-devices"></i>
        <p>No hay dispositivos registrados</p>
        <span>Activa las notificaciones para registrar tu dispositivo</span>
      </div>
      
      <div v-else class="device-grid">
        <div
          v-for="device in devices"
          :key="device.id"
          class="device-card"
          :class="{ inactive: !device.is_active }"
        >
          <div class="device-icon">
            <i :class="getDeviceIcon(device.device_type)"></i>
          </div>
          <div class="device-info">
            <div class="device-name">{{ device.device_name || 'Dispositivo' }}</div>
            <div class="device-meta">
              <span class="device-type">{{ getDeviceTypeLabel(device.device_type) }}</span>
              <span class="device-status" :class="device.is_active ? 'active' : 'inactive'">
                {{ device.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="device-last-used" v-if="device.last_used">
              Último uso: {{ formatDate(device.last_used) }}
            </div>
          </div>
          <button 
            class="btn-delete" 
            @click="confirmDelete(device)"
            title="Eliminar dispositivo"
          >
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Dialog de confirmación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Eliminar Dispositivo"
      :modal="true"
      :closable="false"
      style="max-width: 400px"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle" style="color: #f59e0b; font-size: 2rem;"></i>
        <p>
          ¿Estás seguro de eliminar el dispositivo 
          <strong>{{ deviceToDelete?.device_name || 'este dispositivo' }}</strong>?
        </p>
        <p class="warning-text">Este dispositivo dejará de recibir notificaciones</p>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          severity="danger"
          :loading="deleting"
          @click="deleteDevice"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { usePushDeviceStore } from '@/stores/push-device';
import PushPermission from '@/components/notifications/PushPermission.vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

const pushStore = usePushDeviceStore();
const toast = useToast();

const showDeleteDialog = ref(false);
const deviceToDelete = ref(null);
const deleting = ref(false);

const devices = computed(() => pushStore.devices);
const loading = computed(() => pushStore.loading);

async function loadDevices() {
  try {
    await pushStore.fetchDevices();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los dispositivos',
      life: 3000,
    });
  }
}

function refresh() {
  loadDevices();
}

function getDeviceIcon(type) {
  const icons = {
    android: 'pi pi-android',
    ios: 'pi pi-apple',
    web: 'pi pi-globe',
  };
  return icons[type] || 'pi pi-devices';
}

function getDeviceTypeLabel(type) {
  const labels = {
    android: 'Android',
    ios: 'iOS',
    web: 'Web',
  };
  return labels[type] || type;
}

function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function confirmDelete(device) {
  deviceToDelete.value = device;
  showDeleteDialog.value = true;
}

async function deleteDevice() {
  if (!deviceToDelete.value) return;
  
  deleting.value = true;
  try {
    await pushStore.deleteDevice(deviceToDelete.value.id);
    showDeleteDialog.value = false;
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Dispositivo eliminado correctamente',
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo eliminar el dispositivo',
      life: 3000,
    });
  } finally {
    deleting.value = false;
    deviceToDelete.value = null;
  }
}

onMounted(() => {
  loadDevices();
});
</script>

<style scoped>
.devices-view {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.devices-list {
  margin-top: 2rem;
}

.devices-list h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 1rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #6b7280;
}

.loading-state i {
  font-size: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.empty-state i {
  font-size: 3rem;
  color: #d1d5db;
  display: block;
  margin-bottom: 1rem;
}

.empty-state p {
  font-weight: 500;
  color: #1a1a2e;
  margin: 0;
}

.empty-state span {
  font-size: 0.85rem;
  color: #6b7280;
}

.device-grid {
  display: grid;
  gap: 1rem;
}

.device-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.device-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.device-card.inactive {
  opacity: 0.6;
}

.device-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(126, 9, 126, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: var(--color-primary-2);
  flex-shrink: 0;
}

.device-info {
  flex: 1;
}

.device-name {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 1rem;
}

.device-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.25rem;
}

.device-type {
  font-size: 0.8rem;
  color: #6b7280;
}

.device-status {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
}

.device-status.active {
  background: #dcfce7;
  color: #166534;
}

.device-status.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.device-last-used {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.btn-delete {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

.delete-confirmation {
  text-align: center;
  padding: 1rem 0;
}

.delete-confirmation i {
  margin-bottom: 1rem;
}

.delete-confirmation p {
  color: #6b7280;
  margin: 0.5rem 0;
}

.delete-confirmation .warning-text {
  color: #dc2626;
  font-size: 0.9rem;
}
</style>