<template>
  <div class="orders-list">
    <div class="page-header">
      <div>
        <h1>Pedidos</h1>
        <p class="subtitle">Gestiona los pedidos de tu restaurante</p>
      </div>
      <div class="header-actions">
        <button class="btn-refresh" @click="refreshOrders" :disabled="loading">
          <i class="pi pi-refresh" :class="{ 'pi-spin': loading }"></i>
          Actualizar
        </button>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="stats-bar">
      <div 
        v-for="stat in statusStats" 
        :key="stat.status"
        class="stat-item"
        :class="{ active: filters.status === stat.status }"
        @click="filterByStatus(stat.status)"
      >
        <span class="stat-count">{{ stat.count }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="filters-left">
        <div class="search-wrapper">
          <i class="pi pi-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar pedido por ID o cliente..."
            class="search-input"
            @input="applyFilters"
          />
        </div>
        <select v-model="filters.status" class="filter-select" @change="applyFilters">
          <option value="">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="confirmed">Confirmados</option>
          <option value="preparing">En preparación</option>
          <option value="ready">Listos</option>
          <option value="assigned">Esperando respuesta del repartidor</option>
          <option value="in_delivery">En camino</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
          <option value="rejected">Rechazados</option>
        </select>
      </div>
      <div class="filters-right">
        <select v-model="sortBy" class="filter-select" @change="applyFilters">
          <option value="-created_at">Más recientes</option>
          <option value="created_at">Más antiguos</option>
          <option value="total">Mayor total</option>
          <option value="-total">Menor total</option>
        </select>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando pedidos...</span>
    </div>

    <!-- Lista de pedidos -->
    <div v-else-if="orders.length > 0" class="orders-grid">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        @click="viewOrder(order.id)"
      >
        <div class="order-header">
          <div class="order-info">
            <span class="order-id">#{{ order.id }}</span>
            <OrderStatusBadge :status="order.status" />
          </div>
          <span class="order-time">{{ formatTime(order.created_at) }}</span>
        </div>

        <div class="order-body">
          <div class="order-client">
            <i class="pi pi-user"></i>
            <span>{{ order.client_name || 'Cliente' }}</span>
          </div>
          <div class="order-total">
            <span class="total-label">Total:</span>
            <span class="total-amount">${{ parseFloat(order.total).toFixed(2) }}</span>
          </div>
        </div>

        <div class="order-footer">
          <div class="order-items">
            <i class="pi pi-shopping-bag"></i>
            <span>{{ order.total_items || 0 }} productos</span>
          </div>
          <div class="order-finance">
            <span class="payment-status" :class="{ 'is-paid': order.is_paid }">
              {{ order.is_paid ? 'Pagado' : 'Pago pendiente' }}
            </span>
            <span v-if="order.is_paid && order.restaurant_earnings !== null && order.restaurant_earnings !== undefined" class="restaurant-earning">
              Tu ganancia: {{ formatCurrency(order.restaurant_earnings) }}
            </span>
          </div>
          <div class="order-actions" @click.stop>
            <button
              v-if="canAccept(order)"
              class="action-btn btn-success"
              @click="updateStatus(order.id, 'confirmed')"
              title="Aceptar pedido"
            >
              <i class="pi pi-check"></i> Aceptar
            </button>
            <button
              v-if="canReject(order)"
              class="action-btn btn-danger"
              @click="rejectOrder(order)"
              title="Rechazar pedido"
            >
              <i class="pi pi-times"></i> Rechazar
            </button>
            <button
              v-if="canPrepare(order)"
              class="action-btn btn-primary"
              @click="updateStatus(order.id, 'preparing')"
              title="Comenzar preparación"
            >
              <i class="pi pi-clock"></i> Preparar
            </button>
            <button
              v-if="canReady(order)"
              class="action-btn btn-success"
              @click="updateStatus(order.id, 'ready')"
              title="Marcar como listo"
            >
              <i class="pi pi-check-circle"></i> Listo
            </button>
            <button
              v-if="canRetryAutoAssign(order)"
              class="action-btn btn-purple"
              :disabled="retryingOrderId === order.id"
              @click="retryAutoAssign(order.id)"
              title="Reintentar despacho automático"
            >
              <i :class="retryingOrderId === order.id ? 'pi pi-spin pi-spinner' : 'pi pi-truck'"></i>
              {{ retryingOrderId === order.id ? 'Buscando...' : 'Reintentar despacho' }}
            </button>
            <button
              v-if="canRetryAutoAssign(order)"
              class="action-btn btn-secondary"
              @click.stop="openManualAssign(order)"
              title="Buscar y asignar un repartidor manualmente"
            >
              <i class="pi pi-search"></i> Buscar manualmente
            </button>
            <button
              class="action-btn btn-secondary"
              @click="viewOrder(order.id)"
              title="Ver detalles"
            >
              <i class="pi pi-eye"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="empty-state">
      <i class="pi pi-inbox"></i>
      <h3>No hay pedidos</h3>
      <p>Los pedidos aparecerán aquí cuando los clientes realicen órdenes</p>
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

    <div v-if="showManualAssignModal" class="modal-overlay" @click="closeManualAssign">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Asignar repartidor al pedido #{{ selectedOrder?.id }}</h3>
          <button class="modal-close" @click="closeManualAssign">×</button>
        </div>
        <div class="modal-body">
          <div class="assign-tabs">
            <button
              class="tab-btn"
              :class="{ active: manualAssignTab === 'nearby' }"
              :disabled="manualAssignLoading"
              @click="changeManualAssignTab('nearby')"
            >
              <i class="pi pi-map-marker"></i> Cercanos
            </button>
            <button
              class="tab-btn"
              :class="{ active: manualAssignTab === 'all' }"
              :disabled="manualAssignLoading"
              @click="changeManualAssignTab('all')"
            >
              <i class="pi pi-users"></i> Todos disponibles
            </button>
          </div>

          <p class="assign-info">
            <i class="pi pi-info-circle"></i>
            {{ manualAssignTab === 'nearby'
              ? 'Selecciona un repartidor cercano al restaurante.'
              : 'Selecciona cualquier repartidor disponible.' }}
          </p>

          <div v-if="manualAssignLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Buscando repartidores...</span>
          </div>
          <div v-else-if="manualDeliveryPeople.length === 0" class="empty-state">
            <i class="pi pi-exclamation-circle"></i>
            <p>{{ manualAssignTab === 'nearby'
              ? 'No hay repartidores cercanos disponibles.'
              : 'No hay repartidores disponibles en este momento.' }}</p>
            <button class="btn-secondary" @click="loadManualDeliveryPeople">Buscar de nuevo</button>
          </div>
          <div v-else class="delivery-list">
            <div v-for="delivery in manualDeliveryPeople" :key="delivery.id" class="delivery-item">
              <div class="delivery-info">
                <div class="delivery-avatar"><i class="pi pi-user"></i></div>
                <div class="delivery-details">
                  <span class="delivery-name">{{ delivery.full_name || delivery.username }}</span>
                  <div class="delivery-meta">
                    <span v-if="delivery.phone" class="delivery-phone">
                      <i class="pi pi-phone"></i> {{ delivery.phone }}
                    </span>
                    <span v-if="delivery.distance_km !== null && delivery.distance_km !== undefined" class="delivery-distance">
                      {{ delivery.distance_km }} km
                    </span>
                  </div>
                </div>
              </div>
              <button
                class="btn-primary btn-sm"
                :disabled="manualAssigning"
                @click="assignManualDelivery(delivery.id)"
              >
                {{ manualAssigning ? 'Enviando...' : 'Asignar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast de notificación -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      <i :class="toastIcon"></i>
      <span>{{ toastMessage }}</span>
      <button class="toast-close" @click="toastMessage = ''">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useOrdersStore } from '@/stores/orders';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge.vue';

const router = useRouter();
const ordersStore = useOrdersStore();

// Estado local
const searchQuery = ref('');
const sortBy = ref('-created_at');
const retryingOrderId = ref(null);
const showManualAssignModal = ref(false);
const selectedOrder = ref(null);
const manualAssignTab = ref('nearby');
const manualAssignLoading = ref(false);
const manualAssigning = ref(false);
const manualDeliveryPeople = ref([]);
const toastMessage = ref('');
const toastType = ref('success');

// Computed
const orders = computed(() => ordersStore.orders);
const loading = computed(() => ordersStore.loading);
const pagination = computed(() => ordersStore.pagination);
const filters = computed(() => ordersStore.filters);
const stats = computed(() => ordersStore.stats);
const totalPages = computed(() => Math.ceil(pagination.value.count / pagination.value.pageSize) || 1);

const toastIcon = computed(() => {
  return toastType.value === 'success' ? 'pi pi-check-circle' : 'pi pi-exclamation-circle';
});

// Estadísticas para la barra
const statusStats = computed(() => [
  { status: '', label: 'Todos', count: stats.value.total_count },
  { status: 'pending', label: 'Pendientes', count: stats.value.pending_count },
  { status: 'confirmed', label: 'Confirmados', count: stats.value.confirmed_count },
  { status: 'preparing', label: 'Preparando', count: stats.value.preparing_count },
  { status: 'ready', label: 'Listos', count: stats.value.ready_count },
  { status: 'assigned', label: 'Esperando respuesta', count: stats.value.assigned_count },
  { status: 'in_delivery', label: 'En camino', count: stats.value.in_delivery_count },
  { status: 'delivered', label: 'Entregados', count: stats.value.delivered_count },
]);

// Funciones de estado
function canAccept(order) {
  return order.status === 'pending';
}

function canReject(order) {
  return order.status === 'pending';
}

function canPrepare(order) {
  return order.status === 'confirmed';
}

function canReady(order) {
  return order.status === 'preparing';
}

function canRetryAutoAssign(order) {
  return order.status === 'ready' && !order.delivery_person;
}

function canTransitionTo(order, newStatus) {
  const validTransitions = {
    'pending': ['confirmed', 'cancelled', 'rejected'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready'],
    'ready': ['assigned'],
    'assigned': ['in_delivery'],
    'in_delivery': ['delivered'],
  };
  
  const allowed = validTransitions[order.status] || [];
  return allowed.includes(newStatus);
}

// Acciones
async function loadOrders() {
  try {
    await ordersStore.fetchOrders({
      page: 1,
      search: searchQuery.value || undefined,
      ordering: sortBy.value,
    });
  } catch (error) {
    showToast('Error al cargar pedidos', 'error');
  }
}

function applyFilters() {
  ordersStore.setFilters({
    page: 1,
    status: filters.value.status,
  });
  loadOrders();
}

function filterByStatus(status) {
  ordersStore.setFilters({ status, page: 1 });
  loadOrders();
}

function refreshOrders() {
  loadOrders();
}

function changePage(page) {
  ordersStore.setFilters({ page });
  loadOrders();
}

function viewOrder(id) {
  router.push(`/orders/${id}`);
}

async function updateStatus(orderId, status) {
  try {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) {
      showToast('Pedido no encontrado', 'error');
      return;
    }
    
    console.log('📋 Pedido actual:', {
      id: order.id,
      status: order.status,
      status_display: order.status_display,
    });
    
    if (!canTransitionTo(order, status)) {
      const validTransitions = ordersStore.getValidTransitions(orderId);
      const validLabels = validTransitions.map(s => ordersStore.getStatusLabel(s)).join(', ');
      showToast(
        `No se puede cambiar de '${ordersStore.getStatusLabel(order.status)}' a '${ordersStore.getStatusLabel(status)}'. Transiciones válidas: ${validLabels}`,
        'error'
      );
      return;
    }
    
    console.log(`🔄 Intentando cambiar de '${order.status}' a '${status}'`);
    
    const result = await ordersStore.updateOrderStatus(orderId, status);
    showToast(
      status === 'ready'
        ? result.assignment_message || 'Pedido listo; se inició el despacho automático.'
        : 'Estado actualizado correctamente',
      status === 'ready' && !result.assignment ? 'info' : 'success'
    );
    await loadOrders();
  } catch (error) {
    console.error('❌ Error en updateStatus:', error);
    showToast(error.message || 'Error al actualizar estado', 'error');
  }
}

async function rejectOrder(order) {
  if (confirm(`¿Estás seguro de rechazar el pedido #${order.id}?`)) {
    await updateStatus(order.id, 'rejected');
  }
}

function formatTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(amount);
}

async function retryAutoAssign(orderId) {
  if (retryingOrderId.value !== null) return;

  retryingOrderId.value = orderId;
  try {
    const result = await ordersStore.autoAssignDelivery(orderId);
    showToast(
      result.message || 'Solicitud enviada; esperando aceptación del repartidor.',
      result.conflict ? 'info' : 'success',
    );
    await loadOrders();
  } catch (error) {
    showToast(error.message || 'No se pudo reintentar el despacho automático', 'error');
  } finally {
    retryingOrderId.value = null;
  }
}

async function openManualAssign(order) {
  selectedOrder.value = order;
  manualAssignTab.value = 'nearby';
  showManualAssignModal.value = true;
  await loadManualDeliveryPeople();
}

function closeManualAssign() {
  showManualAssignModal.value = false;
  selectedOrder.value = null;
  manualDeliveryPeople.value = [];
}

async function changeManualAssignTab(tab) {
  manualAssignTab.value = tab;
  await loadManualDeliveryPeople();
}

async function loadManualDeliveryPeople() {
  if (!selectedOrder.value) return;

  manualAssignLoading.value = true;
  manualDeliveryPeople.value = [];
  try {
    if (manualAssignTab.value === 'nearby') {
      const result = await ordersStore.findNearestDeliveryPeople(selectedOrder.value.id, 5, 10);
      manualDeliveryPeople.value = result.available_delivery_people || [];
    } else {
      manualDeliveryPeople.value = await ordersStore.fetchAllAvailableDeliveryPeople();
    }
  } catch (error) {
    showToast(error.message || 'Error al buscar repartidores', 'error');
  } finally {
    manualAssignLoading.value = false;
  }
}

async function assignManualDelivery(deliveryPersonId) {
  if (!selectedOrder.value || manualAssigning.value) return;

  manualAssigning.value = true;
  try {
    const result = await ordersStore.assignDelivery(selectedOrder.value.id, deliveryPersonId);
    showToast(result.message || 'Solicitud enviada; esperando aceptación del repartidor.', 'success');
    closeManualAssign();
    await loadOrders();
  } catch (error) {
    showToast(error.message || 'Error al asignar repartidor', 'error');
  } finally {
    manualAssigning.value = false;
  }
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
  loadOrders();
});

// Watch para cambios en filtros
watch(() => filters.value.status, () => {
  loadOrders();
});
</script>

<style scoped>
.orders-list {
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

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.stat-item {
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-item:hover {
  background: #f3f4f6;
}

.stat-item.active {
  border-color: var(--color-primary-2);
  background: rgba(126, 9, 126, 0.08);
}

.stat-count {
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Filters */
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
  flex: 1;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-wrapper i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-input {
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary-3);
  box-shadow: 0 0 0 3px rgba(188, 74, 185, 0.1);
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
  border-color: var(--color-primary-3);
}

/* Orders Grid */
.orders-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.order-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.order-id {
  font-weight: 700;
  color: #1a1a2e;
  font-size: 1rem;
}

.order-time {
  color: #6b7280;
  font-size: 0.8rem;
}

.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.order-client {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
}

.order-client i {
  color: #6b7280;
}

.order-total {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.total-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.total-amount {
  font-weight: 700;
  color: var(--color-primary-2);
  font-size: 1.1rem;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.order-finance {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.payment-status {
  color: #92400e;
}

.payment-status.is-paid {
  color: #15803d;
}

.restaurant-earning {
  color: #374151;
  font-weight: 600;
}

.order-items {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.order-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  padding: 0.25rem 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: scale(1.05);
}

.btn-success {
  background: #dcfce7;
  color: #166534;
}

.btn-success:hover {
  background: #bbf7d0;
}

.btn-danger {
  background: #fee2e2;
  color: #991b1b;
}

.btn-danger:hover {
  background: #fecaca;
}

.btn-primary {
  background: #dbeafe;
  color: #1e40af;
}

.btn-primary:hover {
  background: #bfdbfe;
}

.btn-purple {
  background: #ede9fe;
  color: #5b21b6;
}

.btn-purple:hover {
  background: #ddd6fe;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Toast info */
.toast.info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

/* ============================================
   MODAL DE ASIGNACIÓN
   ============================================ */
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
  max-width: 550px;
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

/* Pestañas */
.assign-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.85rem;
  color: #6b7280;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #1a1a2e;
}

.tab-btn.active {
  background: rgba(126, 9, 126, 0.08);
  color: var(--color-primary-2);
  font-weight: 600;
}

.assign-info {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  padding: 2rem;
  color: #6b7280;
}

.empty-state i {
  font-size: 2rem;
  color: #d1d5db;
  display: block;
  margin-bottom: 0.5rem;
}

.empty-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
  flex-wrap: wrap;
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
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 10px;
  transition: all 0.2s;
}

.delivery-item:hover {
  background: #f3f4f6;
}

.delivery-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.delivery-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(126, 9, 126, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-2);
  font-size: 1rem;
  flex-shrink: 0;
}

.delivery-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
}

.delivery-name {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 0.9rem;
}

.delivery-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: #6b7280;
}

.delivery-meta span {
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.delivery-rating {
  color: #f59e0b;
}

.delivery-completed {
  color: #3b82f6;
}

.delivery-status {
  display: flex;
  align-items: center;
  margin-right: 0.5rem;
}

.status-badge {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
}

.status-badge.available {
  background: #dcfce7;
  color: #166534;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-sm:hover {
  transform: scale(1.02);
}

.btn-sm.btn-primary {
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
}

.btn-sm.btn-primary:hover {
  box-shadow: 0 4px 15px rgba(126, 9, 126, 0.3);
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

/* Pagination */
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

/* Responsive */
@media (max-width: 480px) {
  .assign-tabs {
    flex-direction: column;
  }
  
  .delivery-item {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .delivery-info {
    flex-wrap: wrap;
  }
  
  .delivery-status {
    margin-right: 0;
  }
  
  .modal-content {
    max-width: 95%;
  }
}
</style>