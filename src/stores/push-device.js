import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const usePushDeviceStore = defineStore('pushDevice', () => {
  // Estado
  const devices = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const currentToken = ref(null);
  const isRegistered = ref(false);

  // Getters
  const activeDevices = computed(() => 
    devices.value.filter(d => d.is_active)
  );

  const deviceCount = computed(() => devices.value.length);

  // Acciones
  async function registerDevice(token, deviceType = 'web', deviceName = 'Web Browser') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/notifications/fcm/device/', {
        token,
        device_type: deviceType,
        device_name: deviceName,
        device_model: navigator.userAgent || 'Unknown',
        os_version: navigator.platform || 'Unknown',
        app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      });
      
      currentToken.value = token;
      isRegistered.value = true;
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al registrar dispositivo';
      console.error('Error registering device:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function unregisterDevice(token) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.delete('/notifications/fcm/device/', {
        data: { token }
      });
      
      currentToken.value = null;
      isRegistered.value = false;
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al desregistrar dispositivo';
      console.error('Error unregistering device:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchDevices() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get('/notifications/fcm/devices/');
      devices.value = response.data.results || response.data || [];
      return devices.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar dispositivos';
      console.error('Error fetching devices:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDevice(deviceId) {
    loading.value = true;
    error.value = null;
    
    try {
      await api.delete(`/notifications/fcm/devices/${deviceId}/`);
      devices.value = devices.value.filter(d => d.id !== deviceId);
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar dispositivo';
      console.error('Error deleting device:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    devices,
    loading,
    error,
    currentToken,
    isRegistered,
    activeDevices,
    deviceCount,
    registerDevice,
    unregisterDevice,
    fetchDevices,
    deleteDevice,
    clearError,
  };
});