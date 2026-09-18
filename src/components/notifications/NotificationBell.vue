<template>
  <div class="notification-bell" @click="toggleDropdown">
    <button 
      class="bell-button"
      :class="{ 'has-unread': hasUnread, 'has-new': hasNewNotifications }"
      title="Notificaciones"
    >
      <i class="pi pi-bell"></i>
      <NotificationBadge 
        v-if="unreadCount > 0" 
        :count="unreadCount" 
        size="sm"
      />
    </button>

    <!-- Dropdown de notificaciones -->
    <div 
      v-if="isOpen" 
      class="notification-dropdown"
      @click.stop
    >
      <div class="dropdown-header">
        <span class="dropdown-title">Notificaciones no leídas</span>
        <button 
          v-if="hasUnread" 
          class="mark-all-read" 
          @click="markAllAsRead"
        >
          Marcar todas como leídas
        </button>
      </div>

      <div v-if="loading" class="dropdown-loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando...</span>
      </div>

      <div v-else-if="unreadNotifications.length === 0" class="dropdown-empty">
        <i class="pi pi-inbox"></i>
        <p>No hay notificaciones sin leer</p>
        <span class="empty-subtext">Todas tus notificaciones están leídas</span>
      </div>

      <div v-else class="dropdown-list">
        <NotificationItem
          v-for="notification in unreadNotifications"
          :key="notification.id"
          :notification="notification"
          @click="handleNotificationClick"
          @mark-read="handleMarkRead"
        />
      </div>

      <div class="dropdown-footer">
        <router-link to="/notifications" class="view-all">
          Ver todas las notificaciones
          <i class="pi pi-arrow-right"></i>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationsStore } from '@/stores/notifications';
import NotificationBadge from './NotificationBadge.vue';
import NotificationItem from './NotificationItem.vue';
import pollingService from '@/services/polling';

const router = useRouter();
const notificationsStore = useNotificationsStore();

const isOpen = ref(false);
const loading = ref(false);

const unreadCount = computed(() => notificationsStore.unreadCount);
const hasUnread = computed(() => notificationsStore.hasUnread);
const hasNewNotifications = computed(() => notificationsStore.hasNewNotifications);
const unreadNotifications = computed(() => 
  notificationsStore.notifications
    .filter(n => !n.is_read && !n.is_archived)
    .slice(0, 5)
);

async function toggleDropdown() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    notificationsStore.resetNewNotifications();
    await loadNotifications();
  }
}

async function loadNotifications() {
  loading.value = true;
  try {
    await notificationsStore.fetchNotifications({ 
      page: 1, 
      pageSize: 10,
      is_read: false 
    });
    await notificationsStore.fetchUnreadCount();
  } catch (error) {
    console.error('Error loading notifications:', error);
  } finally {
    loading.value = false;
  }
}

function handleNotificationClick(notification) {
  isOpen.value = false;
  
  if (notification.action_url) {
    router.push(notification.action_url);
  }
}

async function handleMarkRead(notificationId) {
  await notificationsStore.markAsRead(notificationId);
  await loadNotifications();
}

async function markAllAsRead() {
  await notificationsStore.markAllAsRead();
  await loadNotifications();
}

function handleClickOutside(event) {
  if (isOpen.value && !event.target.closest('.notification-bell')) {
    isOpen.value = false;
  }
}

// Escuchar eventos de polling para actualizar el badge
function setupPollingEvents() {
  pollingService.on('new_notifications', () => {
    notificationsStore.fetchUnreadCount();
  });
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  notificationsStore.fetchUnreadCount();
  setupPollingEvents();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.notification-bell {
  position: relative;
  display: inline-block;
}

.bell-button {
  position: relative;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  color: #6b7280;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-button:hover {
  background: rgba(126, 9, 126, 0.08);
  color: var(--color-primary-2);
}

.bell-button.has-unread {
  color: var(--color-primary-2);
}

.bell-button.has-new {
  animation: ring 0.5s ease;
}

@keyframes ring {
  0% { transform: rotate(0deg); }
  10% { transform: rotate(10deg); }
  20% { transform: rotate(-10deg); }
  30% { transform: rotate(6deg); }
  40% { transform: rotate(-6deg); }
  50% { transform: rotate(3deg); }
  60% { transform: rotate(-3deg); }
  70% { transform: rotate(1deg); }
  80% { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 380px;
  max-height: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.dropdown-title {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 1rem;
}

.mark-all-read {
  background: none;
  border: none;
  color: var(--color-primary-2);
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 500;
}

.mark-all-read:hover {
  text-decoration: underline;
}

.dropdown-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #6b7280;
}

.dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
}

.dropdown-empty i {
  font-size: 2rem;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.dropdown-empty p {
  font-weight: 500;
  color: #1a1a2e;
  margin: 0;
}

.empty-subtext {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.dropdown-list {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
}

.dropdown-list::-webkit-scrollbar {
  width: 4px;
}

.dropdown-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dropdown-list::-webkit-scrollbar-thumb {
  background: var(--color-primary-3);
  border-radius: 2px;
}

.dropdown-footer {
  padding: 0.75rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  text-align: center;
  flex-shrink: 0;
}

.view-all {
  color: var(--color-primary-2);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.view-all:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 480px) {
  .notification-dropdown {
    width: 320px;
    right: -60px;
  }
}
</style>