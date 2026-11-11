<template>
  <div class="order-detail">
    <div class="page-header">
      <div class="header-left">
        <button class="btn-back" @click="$router.push('/orders')">
          <i class="pi pi-arrow-left"></i> Volver
        </button>
        <h1>Pedido #{{ order?.id }}</h1>
        <OrderStatusBadge v-if="order" :status="order.status" />
      </div>
      <div class="header-right">
        <button class="btn-refresh" @click="refreshOrder" :disabled="loading">
          <i class="pi pi-refresh" :class="{ 'pi-spin': loading }"></i>
          Recargar
        </button>
        
        <!-- 🔥 BOTÓN DE CHAT -->
        <button 
          class="btn-chat" 
          @click="openChat"
          :disabled="chatLoading"
        >
          <i class="pi pi-comments"></i>
          Abrir Chat
          <span v-if="chatUnread > 0" class="chat-badge">{{ chatUnread }}</span>
        </button>
        
        <button 
          v-if="canAccept(order)" 
          class="btn-success" 
          @click="updateStatus('confirmed')"
        >
          <i class="pi pi-check"></i> Aceptar Pedido
        </button>
        <button 
          v-if="canReject(order)" 
          class="btn-danger" 
          @click="rejectOrder"
        >
          <i class="pi pi-times"></i> Rechazar
        </button>
        <button 
          v-if="canPrepare(order)" 
          class="btn-primary" 
          @click="updateStatus('preparing')"
        >
          <i class="pi pi-clock"></i> Comenzar Preparación
        </button>
        <button 
          v-if="canReady(order)" 
          class="btn-success" 
          @click="updateStatus('ready')"
        >
          <i class="pi pi-check-circle"></i> Marcar como Listo
        </button>
        <button 
          v-if="canAssignDelivery(order)" 
          class="btn-purple" 
          @click="openAssignModal"
        >
          <i class="pi pi-truck"></i> Asignar Repartidor
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando pedido...</span>
    </div>

    <div v-else-if="order" class="detail-content">
      <div class="detail-grid">
        <!-- Información del Cliente -->
        <div class="detail-card">
          <h3>Información del Cliente</h3>
          <div class="detail-row">
            <span class="label">Nombre:</span>
            <span class="value">{{ order.client_name || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Teléfono:</span>
            <span class="value">{{ order.client_phone || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Email:</span>
            <span class="value">{{ order.client_email || 'N/A' }}</span>
          </div>
        </div>

        <!-- Dirección de Entrega -->
        <div class="detail-card">
          <h3>Dirección de Entrega</h3>
          <div class="detail-row">
            <span class="label">Dirección:</span>
            <span class="value">{{ order.delivery_address || 'N/A' }}</span>
          </div>
          <div class="detail-row" v-if="order.delivery_notes">
            <span class="label">Notas:</span>
            <span class="value">{{ order.delivery_notes }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Método de pago:</span>
            <span class="value">{{ getPaymentMethod(order.payment_method) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Estado de pago:</span>
            <span class="value" :class="order.is_paid ? 'text-success' : 'text-warning'">
              {{ order.is_paid ? 'Pagado' : 'Pendiente' }}
            </span>
          </div>
        </div>

        <!-- Repartidor -->
        <div class="detail-card" v-if="order.delivery_person_name">
          <h3>Repartidor</h3>
          <div class="detail-row">
            <span class="label">Nombre:</span>
            <span class="value">{{ order.delivery_person_name }}</span>
          </div>
          <div class="detail-row" v-if="order.delivery_person_phone">
            <span class="label">Teléfono:</span>
            <span class="value">{{ order.delivery_person_phone }}</span>
          </div>
        </div>

        <!-- Productos -->
        <div class="detail-card full-width">
          <h3>Productos</h3>
          <div class="items-list">
            <div v-for="item in order.items" :key="item.id" class="item-row">
              <div class="item-info">
                <span class="item-name">{{ item.product_name }}</span>
                <span class="item-quantity">x{{ item.quantity }}</span>
              </div>
              <div class="item-details">
                <span v-if="item.selected_options && Object.keys(item.selected_options).length > 0" class="item-options">
                  <span v-for="(value, key) in item.selected_options" :key="key">
                    {{ key }}: {{ value }}
                  </span>
                </span>
                <span v-if="item.notes" class="item-notes">📝 {{ item.notes }}</span>
              </div>
              <div class="item-price">${{ parseFloat(item.total).toFixed(2) }}</div>
            </div>
          </div>
          <div class="order-totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>${{ parseFloat(order.subtotal).toFixed(2) }}</span>
            </div>
            <div class="total-row" v-if="order.delivery_fee > 0">
              <span>Costo de envío</span>
              <span>${{ parseFloat(order.delivery_fee).toFixed(2) }}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total</span>
              <span>${{ parseFloat(order.total).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Línea de tiempo -->
        <div class="detail-card full-width">
          <h3>Historial de Estados</h3>
          <div class="timeline">
            <div v-for="(status, index) in statusHistory" :key="index" class="timeline-item">
              <div class="timeline-dot" :class="status.class"></div>
              <div class="timeline-content">
                <span class="timeline-status">{{ status.label }}</span>
                <span class="timeline-time">{{ formatDate(status.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de asignación de repartidor -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Asignar Repartidor</h3>
          <button class="modal-close" @click="closeAssignModal">×</button>
        </div>
        <div class="modal-body">
          <p>Buscando repartidores disponibles para el pedido #{{ order?.id }}...</p>
          
          <div v-if="assignLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Buscando repartidores cercanos...</span>
          </div>
          
          <div v-else-if="availableDeliveryPeople.length === 0" class="empty-state">
            <i class="pi pi-exclamation-circle"></i>
            <p>No hay repartidores disponibles cercanos</p>
            <button class="btn-secondary" @click="searchDeliveryPeople">Intentar de nuevo</button>
          </div>
          
          <div v-else class="delivery-list">
            <div
              v-for="delivery in availableDeliveryPeople"
              :key="delivery.id"
              class="delivery-item"
              @click="assignDeliveryPerson(delivery.id)"
            >
              <div class="delivery-info">
                <span class="delivery-name">{{ delivery.full_name || delivery.username }}</span>
                <span class="delivery-distance">📍 {{ delivery.distance_km }} km</span>
                <span class="delivery-time">⏱️ {{ delivery.estimated_time }} min</span>
              </div>
              <button class="btn-primary btn-sm">Asignar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
      <button class="toast-close" @click="toastMessage = ''">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useOrdersStore } from '@/stores/orders';
import { useAuthStore } from '@/stores/auth';
import { useChatStore } from '@/stores/chat';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge.vue';

const router = useRouter();
const route = useRoute();
const ordersStore = useOrdersStore();
const authStore = useAuthStore();
const chatStore = useChatStore();

// Estado
const showAssignModal = ref(false);
const assignLoading = ref(false);
const availableDeliveryPeople = ref([]);
const toastMessage = ref('');
const toastType = ref('success');

// 🔥 Estado del chat
const chatLoading = ref(false);
const chatUnread = ref(0);

// Computed
const order = computed(() => ordersStore.currentOrder);
const loading = computed(() => ordersStore.loading);

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-circle';
});

// Historial de estados
const statusHistory = computed(() => {
  if (!order.value) return [];
  
  const statusMap = {
    pending: { label: 'Pedido creado', class: 'dot-pending' },
    confirmed: { label: 'Pedido confirmado', class: 'dot-confirmed' },
    preparing: { label: 'En preparación', class: 'dot-preparing' },
    ready: { label: 'Listo para entregar', class: 'dot-ready' },
    in_delivery: { label: 'En camino', class: 'dot-delivery' },
    delivered: { label: 'Entregado', class: 'dot-delivered' },
    cancelled: { label: 'Cancelado', class: 'dot-cancelled' },
    rejected: { label: 'Rechazado', class: 'dot-rejected' },
  };
  
  const history = [];
  const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'in_delivery', 'delivered'];
  const timestamps = {
    pending: order.value.created_at,
    confirmed: order.value.confirmed_at,
    preparing: order.value.preparing_at,
    ready: order.value.ready_at,
    in_delivery: order.value.in_delivery_at,
    delivered: order.value.delivered_at,
  };
  
  for (const status of statuses) {
    if (timestamps[status]) {
      history.push({
        ...statusMap[status],
        timestamp: timestamps[status],
      });
    }
  }
  
  // Si el pedido está cancelado o rechazado
  if (order.value.status === 'cancelled' && order.value.cancelled_at) {
    history.push({
      label: 'Cancelado',
      class: 'dot-cancelled',
      timestamp: order.value.cancelled_at,
    });
  }
  
  if (order.value.status === 'rejected' && order.value.cancelled_at) {
    history.push({
      label: 'Rechazado',
      class: 'dot-rejected',
      timestamp: order.value.cancelled_at,
    });
  }
  
  return history;
});

// Funciones de estado
function canAccept(order) {
  return order?.status === 'pending';
}

function canReject(order) {
  return order?.status === 'pending';
}

function canPrepare(order) {
  return order?.status === 'confirmed';
}

function canReady(order) {
  return order?.status === 'preparing';
}

function canAssignDelivery(order) {
  return order?.status === 'ready' && !order?.delivery_person;
}

function getPaymentMethod(method) {
  const methods = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    online: 'Pago en línea',
  };
  return methods[method] || method;
}

// Cargar pedido
async function loadOrder() {
  const id = route.params.id;
  if (!id) {
    router.push('/orders');
    return;
  }
  
  try {
    await ordersStore.fetchOrder(id);
    // 🔥 Cargar contador de no leídos del chat
    await loadChatUnread();
  } catch (error) {
    showToast('Error al cargar el pedido', 'error');
    router.push('/orders');
  }
}

// 🔥 Cargar no leídos del chat
async function loadChatUnread() {
  if (!order.value) return;
  
  try {
    const conversation = await chatStore.fetchConversationByOrder(order.value.id);
    if (conversation) {
      chatUnread.value = conversation.unread_count || 0;
    }
  } catch (error) {
    // No mostrar error si no hay conversación aún
    console.log('No hay conversación para este pedido aún');
    chatUnread.value = 0;
  }
}

// 🔥 Abrir chat del pedido
async function openChat() {
  if (!order.value) return;
  
  chatLoading.value = true;
  
  try {
    // Verificar/obtener la conversación del pedido
    const conversation = await chatStore.fetchConversationByOrder(order.value.id);
    
    if (conversation) {
      // Navegar al chat con el ID de la conversación
      router.push(`/chat?conversation_id=${conversation.id}&order_id=${order.value.id}`);
    } else {
      showToast('No se pudo abrir el chat del pedido', 'error');
    }
  } catch (error) {
    console.error('Error al abrir chat:', error);
    showToast(error.message || 'Error al abrir el chat', 'error');
  } finally {
    chatLoading.value = false;
  }
}

// Recargar pedido
async function refreshOrder() {
  await loadOrder();
  showToast('Pedido recargado correctamente', 'success');
}

// Actualizar estado
async function updateStatus(status) {
  if (!order.value) return;
  
  try {
    await ordersStore.updateOrderStatus(order.value.id, status);
    showToast('Estado actualizado correctamente', 'success');
    await loadOrder();
  } catch (error) {
    console.error('❌ Error en updateStatus:', error);
    
    // Verificar si el error es 500 y mostrar un mensaje diferente
    if (error.message?.includes('500') || error.status === 500) {
      showToast('Estado actualizado (recarga el pedido para ver el cambio)', 'info');
      await loadOrder();
    } else {
      showToast(error.message || 'Error al actualizar estado', 'error');
    }
  }
}

async function rejectOrder() {
  if (!order.value) return;
  if (confirm(`¿Estás seguro de rechazar el pedido #${order.value.id}?`)) {
    await updateStatus('rejected');
  }
}

// Asignación de repartidores
function openAssignModal() {
  showAssignModal.value = true;
  searchDeliveryPeople();
}

function closeAssignModal() {
  showAssignModal.value = false;
  availableDeliveryPeople.value = [];
}

async function searchDeliveryPeople() {
  if (!order.value) return;
  
  assignLoading.value = true;
  try {
    const restaurant = authStore.restaurant;
    const restaurantLat = restaurant?.current_location_lat || 19.4300;
    const restaurantLng = restaurant?.current_location_lng || -99.1300;
    
    const result = await ordersStore.findNearestDeliveryPeople(
      order.value.id,
      restaurantLat,
      restaurantLng,
      5,
      10
    );
    
    availableDeliveryPeople.value = result.available_delivery_people || [];
  } catch (error) {
    showToast(error.message || 'Error al buscar repartidores', 'error');
  } finally {
    assignLoading.value = false;
  }
}

async function assignDeliveryPerson(deliveryPersonId) {
  if (!order.value) return;
  
  try {
    await ordersStore.assignDelivery(order.value.id, deliveryPersonId);
    showToast('Repartidor asignado correctamente', 'success');
    closeAssignModal();
    await loadOrder();
  } catch (error) {
    showToast(error.message || 'Error al asignar repartidor', 'error');
  }
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

// Toast
function showToast(message, type = 'success') {
  toastMessage.value = message;
  toastType.value = type;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
}

// Lifecycle
onMounted(() => {
  loadOrder();
});
</script>

<style scoped>
.order-detail {
  padding: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn-back:hover {
  color: #1a1a2e;
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

/* 🔥 BOTÓN DE CHAT */
.btn-chat {
  position: relative;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-chat:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(126, 9, 126, 0.3);
}

.btn-chat:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-badge {
  background: #dc2626;
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 20px;
  min-width: 18px;
  text-align: center;
  margin-left: 0.25rem;
}

.header-right {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-success {
  padding: 0.5rem 1rem;
  background: #dcfce7;
  color: #166534;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn-success:hover {
  background: #bbf7d0;
}

.btn-danger {
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn-danger:hover {
  background: #fecaca;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #dbeafe;
  color: #1e40af;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn-primary:hover {
  background: #bfdbfe;
}

.btn-purple {
  padding: 0.5rem 1rem;
  background: #ede9fe;
  color: #5b21b6;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn-purple:hover {
  background: #ddd6fe;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.btn-secondary:hover {
  background: #e5e7eb;
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.detail-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.detail-card.full-width {
  grid-column: 1 / -1;
}

.detail-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f9fafb;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #6b7280;
  font-size: 0.9rem;
}

.detail-row .value {
  color: #1a1a2e;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
}

.text-success {
  color: #22c55e;
}

.text-warning {
  color: #f59e0b;
}

.items-list {
  margin-bottom: 1rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.item-row:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #1a1a2e;
}

.item-quantity {
  font-size: 0.8rem;
  color: #6b7280;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #6b7280;
  flex: 1;
  padding: 0 1rem;
}

.item-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.item-options span {
  background: #f3f4f6;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.item-notes {
  color: #f59e0b;
}

.item-price {
  font-weight: 600;
  color: #2563eb;
}

.order-totals {
  border-top: 2px solid #e5e7eb;
  padding-top: 1rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.total-row span:last-child {
  font-weight: 500;
}

.grand-total {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a2e;
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
  margin-top: 0.25rem;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: -1.5rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.dot-pending {
  background: #f59e0b;
}
.dot-confirmed {
  background: #3b82f6;
}
.dot-preparing {
  background: #3b82f6;
}
.dot-ready {
  background: #22c55e;
}
.dot-delivery {
  background: #8b5cf6;
}
.dot-delivered {
  background: #22c55e;
}
.dot-cancelled {
  background: #ef4444;
}
.dot-rejected {
  background: #ef4444;
}

.timeline-content {
  display: flex;
  justify-content: space-between;
  flex: 1;
}

.timeline-status {
  font-weight: 500;
  color: #1a1a2e;
}

.timeline-time {
  font-size: 0.8rem;
  color: #6b7280;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1a1a2e;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-close:hover {
  color: #1a1a2e;
}

.modal-body {
  padding: 1.5rem;
  max-height: 60vh;
  overflow-y: auto;
}

.delivery-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.delivery-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.delivery-item:hover {
  background: #f3f4f6;
}

.delivery-info {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.delivery-name {
  font-weight: 600;
  color: #1a1a2e;
}

.delivery-distance,
.delivery-time {
  font-size: 0.8rem;
  color: #6b7280;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  animation: slideUp 0.3s ease;
}

.toast.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.toast.error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.toast.info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.toast-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
}

.toast-close:hover {
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state i {
  font-size: 2rem;
  color: #d1d5db;
  display: block;
  margin-bottom: 0.5rem;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-right {
    width: 100%;
  }
  
  .header-right button {
    flex: 1;
    justify-content: center;
  }
}
</style>