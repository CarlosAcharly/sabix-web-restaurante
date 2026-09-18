<template>
  <div 
    class="notification-item"
    :class="{ unread: !notification.is_read }"
    @click="handleClick"
  >
    <div class="notification-icon" :style="iconStyle">
      <i :class="getIcon(notification.type)"></i>
    </div>
    
    <div class="notification-content">
      <div class="notification-header">
        <span class="notification-title">{{ notification.title }}</span>
        <span class="notification-time">{{ notification.time_ago || formatTime(notification.created_at) }}</span>
      </div>
      <p class="notification-message">{{ notification.message }}</p>
      <div v-if="notification.data?.order_id" class="notification-action">
        <span class="action-label">Pedido #{{ notification.data.order_id }}</span>
        <span v-if="notification.data?.status" class="action-status">
          {{ getStatusLabel(notification.data.status) }}
        </span>
      </div>
    </div>

    <button 
      v-if="!notification.is_read" 
      class="mark-read-btn"
      @click.stop="handleMarkRead"
      title="Marcar como leída"
    >
      <i class="pi pi-check"></i>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  notification: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['click', 'mark-read']);

const iconStyle = computed(() => ({
  background: getIconBackground(props.notification.type),
}));

function getIcon(type) {
  const icons = {
    order_new: 'pi pi-shopping-cart',
    order_confirmed: 'pi pi-check-circle',
    order_preparing: 'pi pi-clock',
    order_ready: 'pi pi-check',
    order_in_delivery: 'pi pi-truck',
    order_delivered: 'pi pi-check-circle',
    order_cancelled: 'pi pi-times-circle',
    order_rejected: 'pi pi-times-circle',
    order_rated: 'pi pi-star',
    promotion: 'pi pi-tag',
    discount: 'pi pi-percentage',
    system: 'pi pi-info-circle',
    reminder: 'pi pi-bell',
    update: 'pi pi-refresh',
    welcome: 'pi pi-user-plus',
    verification: 'pi pi-shield',
    password_changed: 'pi pi-key',
  };
  return icons[type] || 'pi pi-bell';
}

function getIconBackground(type) {
  const backgrounds = {
    order_new: '#dbeafe',
    order_confirmed: '#dcfce7',
    order_preparing: '#fef3c7',
    order_ready: '#dcfce7',
    order_in_delivery: '#ede9fe',
    order_delivered: '#dcfce7',
    order_cancelled: '#fee2e2',
    order_rejected: '#fee2e2',
    order_rated: '#fef3c7',
    promotion: '#fce4ec',
    discount: '#e8f5e9',
    system: '#e3f2fd',
    reminder: '#fff3e0',
    update: '#f3e5f5',
    welcome: '#e8f5e9',
    verification: '#e3f2fd',
    password_changed: '#f3e5f5',
  };
  return backgrounds[type] || '#f3f4f6';
}

function getStatusLabel(status) {
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Listo',
    in_delivery: 'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    rejected: 'Rechazado',
  };
  return labels[status] || status;
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handleClick() {
  emit('click', props.notification);
  if (!props.notification.is_read) {
    emit('mark-read', props.notification.id);
  }
}

function handleMarkRead() {
  emit('mark-read', props.notification.id);
}
</script>

<style scoped>
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f9fafb;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: #f9fafb;
}

.notification-item.unread {
  background: rgba(188, 74, 185, 0.06);
}

.notification-item.unread:hover {
  background: rgba(188, 74, 185, 0.12);
}

.notification-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #1a1a2e;
  font-size: 1rem;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.notification-title {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 0.9rem;
}

.notification-item.unread .notification-title {
  font-weight: 700;
  color: var(--color-primary-2);
}

.notification-time {
  font-size: 0.7rem;
  color: #9ca3af;
  flex-shrink: 0;
  white-space: nowrap;
}

.notification-message {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-action {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
}

.action-label {
  color: var(--color-primary-2);
  font-weight: 500;
}

.action-label:hover {
  text-decoration: underline;
}

.action-status {
  background: #f3f4f6;
  padding: 0.1rem 0.5rem;
  border-radius: 12px;
  color: #6b7280;
  font-size: 0.7rem;
}

.mark-read-btn {
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  color: #9ca3af;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.mark-read-btn:hover {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}
</style>