import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useNotificationsStore = defineStore('notifications', () => {
  // Estado
  const notifications = ref([]);
  const unreadCount = ref(0);
  const loading = ref(false);
  const error = ref(null);
  const hasNewNotifications = ref(false);
  const filters = ref({
    is_read: null,
    is_archived: false,
    type: '',
    page: 1,
    pageSize: 20,
  });
  const pagination = ref({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 20,
  });

  // Getters
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.is_read && !n.is_archived)
  );

  const hasUnread = computed(() => unreadCount.value > 0);

  const notificationsByType = computed(() => {
    const grouped = {};
    notifications.value.forEach(notification => {
      const type = notification.type || 'system';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(notification);
    });
    return grouped;
  });

  // Acciones
  async function fetchNotifications(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const queryParams = {
        page: params.page || filters.value.page || 1,
        page_size: params.pageSize || filters.value.pageSize || 20,
        ...params,
      };
      
      // Limpiar parámetros vacíos
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await api.get('/notifications/', { params: queryParams });
      
      notifications.value = response.data.results || response.data || [];
      
      if (response.data.count !== undefined) {
        pagination.value = {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: params.page || 1,
          pageSize: params.pageSize || 20,
        };
      }
      
      return notifications.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar notificaciones';
      console.error('Error fetching notifications:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadNotifications(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const queryParams = {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        ...params,
      };
      
      const response = await api.get('/notifications/unread/', { params: queryParams });
      
      return response.data.results || response.data || [];
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar notificaciones no leídas';
      console.error('Error fetching unread notifications:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await api.get('/notifications/unread/count/');
      unreadCount.value = response.data.count || 0;
      return unreadCount.value;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      return 0;
    }
  }

  async function markAsRead(notificationId) {
    try {
      const response = await api.post(`/notifications/${notificationId}/read/`);
      
      const index = notifications.value.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        notifications.value[index].is_read = true;
        notifications.value[index].read_at = response.data.notification?.read_at || new Date().toISOString();
      }
      
      await fetchUnreadCount();
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al marcar como leída';
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }

  async function markAllAsRead() {
    try {
      const response = await api.post('/notifications/read-all/');
      
      notifications.value.forEach(n => {
        if (!n.is_read) {
          n.is_read = true;
          n.read_at = new Date().toISOString();
        }
      });
      
      unreadCount.value = 0;
      hasNewNotifications.value = false;
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al marcar todas como leídas';
      console.error('Error marking all as read:', err);
      throw err;
    }
  }

  async function deleteNotification(notificationId) {
    try {
      await api.delete(`/notifications/${notificationId}/`);
      
      notifications.value = notifications.value.filter(n => n.id !== notificationId);
      
      await fetchUnreadCount();
      
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar notificación';
      console.error('Error deleting notification:', err);
      throw err;
    }
  }

  async function fetchPreferences() {
    try {
      const response = await api.get('/notifications/preferences/');
      return response.data;
    } catch (err) {
      console.error('Error fetching preferences:', err);
      throw err;
    }
  }

  async function updatePreferences(preferences) {
    try {
      const response = await api.put('/notifications/preferences/', preferences);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar preferencias';
      console.error('Error updating preferences:', err);
      throw err;
    }
  }

  function addNotification(notification) {
    const exists = notifications.value.some(n => n.id === notification.id);
    if (!exists) {
      notifications.value.unshift({
        ...notification,
        time_ago: 'Ahora',
      });
      if (!notification.is_read) {
        unreadCount.value++;
        hasNewNotifications.value = true;
      }
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      is_read: null,
      is_archived: false,
      type: '',
      page: 1,
      pageSize: 20,
    };
  }

  function clearError() {
    error.value = null;
  }

  function resetNewNotifications() {
    hasNewNotifications.value = false;
  }

  async function broadcastNotification(data) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/notifications/admin/broadcast/', data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al enviar notificación masiva';
      console.error('Error broadcasting notification:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    error,
    filters,
    pagination,
    hasNewNotifications,
    
    unreadNotifications,
    hasUnread,
    notificationsByType,
    
    fetchNotifications,
    fetchUnreadNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchPreferences,
    updatePreferences,
    addNotification,
    setFilters,
    resetFilters,
    clearError,
    resetNewNotifications,
    broadcastNotification,
  };
});