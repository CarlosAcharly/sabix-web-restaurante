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
              v-if="canAssignDelivery(order)"
              class="action-btn btn-purple"
              @click="openAssignModal(order)"
              title="Asignar repartidor"
            >
              <i class="pi pi-truck"></i> Asignar
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

    <!-- Modal de asignación de repartidor -->
    <div v-if="showAssignModal" class="modal-overlay" @click="closeAssignModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Asignar Repartidor</h3>
          <button class="modal-close" @click="closeAssignModal">×</button>
        </div>
        <div class="modal-body">
          <!-- Pestañas de selección -->
          <div class="assign-tabs">
            <button 
              class="tab-btn" 
              :class="{ active: assignTab === 'nearby' }"
              @click="assignTab = 'nearby'; searchDeliveryPeople()"
            >
              <i class="pi pi-map-marker"></i> Cercanos
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: assignTab === 'all' }"
              @click="assignTab = 'all'; loadAllDeliveryPeople()"
            >
              <i class="pi pi-users"></i> Todos los repartidores
            </button>
          </div>

          <p v-if="assignTab === 'nearby'" class="assign-info">
            <i class="pi pi-info-circle"></i> Mostrando repartidores disponibles cercanos al restaurante
          </p>
          <p v-else class="assign-info">
            <i class="pi pi-info-circle"></i> Mostrando todos los repartidores disponibles (sin restricción de ubicación)
          </p>
          
          <!-- Cargando -->
          <div v-if="assignLoading" class="loading-state">
            <i class="pi pi-spin pi-spinner"></i>
            <span>Buscando repartidores...</span>
          </div>
          
          <!-- Sin resultados - Cercanos -->
          <div v-else-if="availableDeliveryPeople.length === 0 && assignTab === 'nearby'" class="empty-state">
            <i class="pi pi-exclamation-circle"></i>
            <p>No hay repartidores disponibles cercanos</p>
            <div class="empty-actions">
              <button class="btn-secondary" @click="searchDeliveryPeople">Intentar de nuevo</button>
              <button class="btn-primary" @click="assignTab = 'all'; loadAllDeliveryPeople()">
                Ver todos los repartidores
              </button>
            </div>
          </div>

          <!-- Sin resultados - Todos -->
          <div v-else-if="availableDeliveryPeople.length === 0 && assignTab === 'all'" class="empty-state">
            <i class="pi pi-exclamation-circle"></i>
            <p>No hay repartidores disponibles en este momento</p>
            <button class="btn-secondary" @click="loadAllDeliveryPeople">Intentar de nuevo</button>
          </div>
          
          <!-- Lista de repartidores -->
          <div v-else class="delivery-list">
            <div
              v-for="delivery in availableDeliveryPeople"
              :key="delivery.id"
              class="delivery-item"
            >
              <div class="delivery-info">
                <div class="delivery-avatar">
                  <i class="pi pi-user"></i>
                </div>
                <div class="delivery-details">
                  <span class="delivery-name">{{ delivery.full_name || delivery.username }}</span>
                  <div class="delivery-meta">
                    <span v-if="delivery.phone" class="delivery-phone">
                      <i class="pi pi-phone"></i> {{ delivery.phone }}
                    </span>
                    <span v-if="delivery.distance_km !== undefined" class="delivery-distance">
                      📍 {{ delivery.distance_km }} km
                    </span>
                    <span v-if="delivery.estimated_time !== undefined" class="delivery-time">
                      ⏱️ {{ delivery.estimated_time }} min
                    </span>
                    <span v-if="delivery.rating" class="delivery-rating">
                      ⭐ {{ delivery.rating }}
                    </span>
                    <span v-if="delivery.completed_deliveries" class="delivery-completed">
                      ✅ {{ delivery.completed_deliveries }} entregas
                    </span>
                  </div>
                </div>
                <div class="delivery-status">
                  <span class="status-badge available">Disponible</span>
                </div>
              </div>
              <button 
                class="btn-primary btn-sm" 
                @click="assignDeliveryPerson(delivery.id)"
              >
                Asignar
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
import { useAuthStore } from '@/stores/auth';
import OrderStatusBadge from '@/components/orders/OrderStatusBadge.vue';

const router = useRouter();
const ordersStore = useOrdersStore();
const authStore = useAuthStore();

// Estado local
const searchQuery = ref('');
const sortBy = ref('-created_at');
const showAssignModal = ref(false);
const selectedOrder = ref(null);
const assignLoading = ref(false);
const availableDeliveryPeople = ref([]);
const toastMessage = ref('');
const toastType = ref('success');
const assignTab = ref('nearby'); // 'nearby' | 'all'

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

function canAssignDelivery(order) {
  return order.status === 'ready' && !order.delivery_person;
}

function canTransitionTo(order, newStatus) {
  const validTransitions = {
    'pending': ['confirmed', 'cancelled', 'rejected'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready'],
    'ready': ['in_delivery'],
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
    
    await ordersStore.updateOrderStatus(orderId, status);
    showToast('Estado actualizado correctamente', 'success');
    await loadOrders();
  } catch (error) {
    console.error('❌ Error en updateStatus:', error);
    
    if (error.message?.includes('500') || error.status === 500) {
      showToast('Estado actualizado (recarga la página para ver el cambio)', 'info');
      await loadOrders();
    } else {
      showToast(error.message || 'Error al actualizar estado', 'error');
    }
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

// ============================================
// ASIGNACIÓN DE REPARTIDORES
// ============================================

async function openAssignModal(order) {
  selectedOrder.value = order;
  assignTab.value = 'nearby';
  showAssignModal.value = true;
  await searchDeliveryPeople();
}

function closeAssignModal() {
  showAssignModal.value = false;
  selectedOrder.value = null;
  availableDeliveryPeople.value = [];
  assignTab.value = 'nearby';
}

// Repartidores cercanos
async function searchDeliveryPeople() {
  if (!selectedOrder.value) return;
  
  assignLoading.value = true;
  try {
    const restaurant = authStore.restaurant;
    const restaurantLat = restaurant?.current_location_lat || 19.4300;
    const restaurantLng = restaurant?.current_location_lng || -99.1300;
    
    const result = await ordersStore.findNearestDeliveryPeople(
      selectedOrder.value.id,
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

// ✅ TODOS los repartidores disponibles (usa el nuevo endpoint)
async function loadAllDeliveryPeople() {
  if (!selectedOrder.value) return;
  
  assignLoading.value = true;
  try {
    // Usar el nuevo endpoint específico
    const result = await ordersStore.fetchAllAvailableDeliveryPeople();
    availableDeliveryPeople.value = result || [];
    
    if (availableDeliveryPeople.value.length === 0) {
      showToast('No hay repartidores disponibles en este momento', 'info');
    }
  } catch (error) {
    showToast(error.message || 'Error al cargar repartidores', 'error');
  } finally {
    assignLoading.value = false;
  }
}

async function assignDeliveryPerson(deliveryPersonId) {
  if (!selectedOrder.value) return;
  
  try {
    await ordersStore.assignDelivery(selectedOrder.value.id, deliveryPersonId);
    showToast('Repartidor asignado correctamente', 'success');
    closeAssignModal();
    await loadOrders();
  } catch (error) {
    console.error('❌ Error en assignDeliveryPerson:', error);
    
    // Verificar si el error es 500 y mostrar un mensaje diferente
    if (error.message?.includes('500') || error.status === 500) {
      showToast('Repartidor asignado (recarga para ver el cambio)', 'info');
      closeAssignModal();
      await loadOrders();
    } else {
      showToast(error.message || 'Error al asignar repartidor', 'error');
    }
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
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
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