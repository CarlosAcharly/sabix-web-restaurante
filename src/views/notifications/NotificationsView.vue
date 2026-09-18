<template>
  <div class="notifications-view">
    <div class="page-header">
      <div>
        <h1>Notificaciones</h1>
        <p class="subtitle">Mantente al día con tus notificaciones</p>
      </div>
      <div class="header-actions">
        <button 
          v-if="hasUnread" 
          class="btn-mark-all" 
          @click="markAllAsRead"
        >
          <i class="pi pi-check-double"></i>
          Marcar todas como leídas
        </button>
        <button class="btn-refresh" @click="refresh" :disabled="loading">
          <i class="pi pi-refresh" :class="{ 'pi-spin': loading }"></i>
          Actualizar
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="filters-left">
        <select v-model="filters.type" class="filter-select" @change="applyFilters">
          <option value="">Todos los tipos</option>
          <option value="order_new">Nuevos pedidos</option>
          <option value="order_confirmed">Pedidos confirmados</option>
          <option value="order_preparing">En preparación</option>
          <option value="order_ready">Listos para entregar</option>
          <option value="order_in_delivery">En camino</option>
          <option value="order_delivered">Entregados</option>
          <option value="order_cancelled">Cancelados</option>
          <option value="system">Sistema</option>
          <option value="promotion">Promociones</option>
        </select>
        <select v-model="filters.is_read" class="filter-select" @change="applyFilters">
          <option value="">Todos</option>
          <option value="false">No leídas</option>
          <option value="true">Leídas</option>
        </select>
      </div>
      <div class="filters-right">
        <span class="filter-info">{{ pagination.count }} notificaciones</span>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando notificaciones...</span>
    </div>

    <!-- Lista de notificaciones -->
    <div v-else-if="notifications.length > 0" class="notifications-list">
      <NotificationItem
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
        @click="handleNotificationClick"
        @mark-read="handleMarkRead"
      />
    </div>

    <!-- Estado vacío -->
    <div v-else class="empty-state">
      <i class="pi pi-inbox"></i>
      <h3>No hay notificaciones</h3>
      <p>Las notificaciones aparecerán aquí cuando tengas actividad</p>
    </div>

    <!-- Paginación -->
    <div v-if="pagination.count > 0" class="pagination">
      <button
        class="page-btn"
        :disabled="pagination.page <= 1"
        @click="changePage(pagination.page - 1)"
      >
        <i class="pi pi-chevron-left"></i>
      </button>
      <span class="page-info">
        Página {{ pagination.page }} de {{ totalPages }}
      </span>
      <button
        class="page-btn"
        :disabled="pagination.page >= totalPages"
        @click="changePage(pagination.page + 1)"
      >
        <i class="pi pi-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '@/stores/notifications';
import NotificationItem from '@/components/notifications/NotificationItem.vue';

const router = useRouter();
const notificationsStore = useNotificationsStore();

const loading = computed(() => notificationsStore.loading);
const notifications = computed(() => notificationsStore.notifications);
const pagination = computed(() => notificationsStore.pagination);
const filters = computed(() => notificationsStore.filters);
const hasUnread = computed(() => notificationsStore.hasUnread);

const totalPages = computed(() => 
  Math.ceil(pagination.value.count / pagination.value.pageSize) || 1
);

async function loadNotifications() {
  try {
    await notificationsStore.fetchNotifications({
      page: 1,
      is_read: filters.value.is_read === '' ? undefined : filters.value.is_read === 'true',
      type: filters.value.type || undefined,
    });
    await notificationsStore.fetchUnreadCount();
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

function applyFilters() {
  loadNotifications();
}

function changePage(page) {
  notificationsStore.setFilters({ page });
  loadNotifications();
}

function refresh() {
  loadNotifications();
}

async function markAllAsRead() {
  await notificationsStore.markAllAsRead();
  await loadNotifications();
}

function handleNotificationClick(notification) {
  if (notification.action_url) {
    router.push(notification.action_url);
  }
}

async function handleMarkRead(notificationId) {
  await notificationsStore.markAsRead(notificationId);
}

onMounted(() => {
  loadNotifications();
});

watch(() => filters.value, () => {
  loadNotifications();
}, { deep: true });
</script>

<style scoped>
.notifications-view {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-mark-all {
  padding: 0.5rem 1rem;
  background: #dcfce7;
  color: #166534;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.btn-mark-all:hover {
  background: #bbf7d0;
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
  font-size: 0.875rem;
}

.btn-refresh:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.filters-left {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  min-width: 150px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #6b7280;
}

.loading-state i {
  font-size: 2rem;
}

.notifications-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.empty-state i {
  font-size: 4rem;
  color: #d1d5db;
  display: block;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>