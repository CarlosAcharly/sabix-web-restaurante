<template>
  <div class="dashboard">
    <!-- Push Permission Banner -->
    <PushPermission class="push-banner" />

    <div class="welcome-banner">
      <div class="welcome-content">
        <h1>¡Bienvenido, {{ userFullName }}! 👋</h1>
        <p>Gestiona tu restaurante, revisa pedidos y actualiza tu menú desde aquí.</p>
      </div>
      <div class="banner-stats" v-if="restaurant">
        <div class="stat-chip">
          <i class="pi pi-check-circle" :class="restaurant.is_verified ? 'text-green' : 'text-yellow'"></i>
          {{ restaurant.is_verified ? 'Restaurante Verificado' : 'Pendiente de Verificación' }}
        </div>
      </div>
    </div>

    <div v-if="loadError" class="dashboard-error" role="alert">
      <i class="pi pi-exclamation-circle"></i>
      <span>{{ loadError }}</span>
      <button type="button" @click="loadDashboardData">Reintentar</button>
    </div>

    <div class="stats-grid">
      <div class="stat-card" style="background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);">
        <div class="stat-icon">
          <i class="pi pi-shopping-cart"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">{{ displayStat(stats.total_orders) }}</span>
          <span class="stat-label text-white">Total Pedidos</span>
        </div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
        <div class="stat-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">{{ displayStat(stats.active_orders) }}</span>
          <span class="stat-label text-white">Pedidos Activos</span>
        </div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <div class="stat-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">{{ displayStat(stats.pending_orders) }}</span>
          <span class="stat-label text-white">Pendientes</span>
        </div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
        <div class="stat-icon">
          <i class="pi pi-dollar"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">{{ formatCurrency(stats.today_income) }}</span>
          <span class="stat-label text-white">Ingresos Hoy</span>
        </div>
      </div>
    </div>

    <!-- Panel de inicio rápido -->
    <div class="quick-actions">
      <h2>Acciones Rápidas</h2>
      <div class="actions-grid">
        <div class="action-card" @click="$router.push('/orders')">
          <i class="pi pi-shopping-cart"></i>
          <span>Ver Pedidos</span>
        </div>
        <div class="action-card" @click="$router.push('/menu')">
          <i class="pi pi-list"></i>
          <span>Gestionar Menú</span>
        </div>
        <div class="action-card" @click="$router.push('/profile')">
          <i class="pi pi-user"></i>
          <span>Mi Perfil</span>
        </div>
      </div>
    </div>

    <!-- Pedidos recientes -->
    <div class="recent-orders">
      <div class="section-header">
        <h2>Pedidos Recientes</h2>
        <button class="text-btn" @click="$router.push('/orders')">Ver todos →</button>
      </div>
      
      <div class="loading-state" v-if="loading">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando datos del restaurante...</span>
      </div>

      <div class="empty-state" v-else-if="recentOrders.length === 0 && !loadError">
        <i class="pi pi-inbox"></i>
        <p>No hay pedidos recientes</p>
        <span>Los pedidos aparecerán aquí cuando lleguen</span>
      </div>
      
      <div v-else-if="recentOrders.length" class="orders-list">
        <button
          v-for="order in recentOrders"
          :key="order.id"
          class="order-item"
          type="button"
          @click="router.push(`/orders/${order.id}`)"
        >
          <div class="order-main">
            <span class="order-id">Pedido #{{ order.id }}</span>
            <span class="order-client">{{ order.client_name || 'Cliente' }}</span>
            <span class="order-time">{{ formatOrderDate(order.created_at) }}</span>
          </div>
          <div class="order-summary">
            <span class="order-status" :class="`status-${order.status}`">
              {{ statusLabel(order.status) }}
            </span>
            <strong>{{ formatCurrency(order.total) }}</strong>
            <i class="pi pi-chevron-right" aria-hidden="true"></i>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import PushPermission from '@/components/notifications/PushPermission.vue';

const router = useRouter();
const authStore = useAuthStore();

const stats = ref({
  total_orders: null,
  active_orders: null,
  pending_orders: null,
  today_income: null,
});
const recentOrders = ref([]);
const loading = ref(false);
const loadError = ref('');

const activeOrderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'in_delivery'];

function getOrdersList(response) {
  const data = response.data;
  const orders = Array.isArray(data) ? data : data?.results;
  if (!Array.isArray(orders)) {
    throw new Error('La respuesta de pedidos tiene un formato inesperado.');
  }
  return orders;
}

function getOrderCount(response) {
  const data = response.data;
  if (typeof data?.count === 'number') return data.count;
  if (Array.isArray(data)) return data.length;
  if (Array.isArray(data?.results)) return data.results.length;
  throw new Error('El servidor no devolvió el total de pedidos.');
}

async function fetchOrdersPage(params) {
  return api.get('/orders/restaurant/orders/', {
    params: { page_size: 100, ordering: '-created_at', ...params },
  });
}

async function fetchTodayIncome() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  let page = 1;
  let income = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchOrdersPage({ page, status: 'delivered' });
    const orders = getOrdersList(response);

    for (const order of orders) {
      const createdAt = new Date(order.created_at);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error('No se pudo interpretar la fecha de un pedido.');
      }

      if (createdAt < startOfToday) {
        hasMore = false;
        break;
      }
      if (order.is_paid) {
        const total = Number(order.total);
        if (!Number.isFinite(total)) {
          throw new Error('No se pudo interpretar el total de un pedido.');
        }
        income += total;
      }
    }

    if (hasMore) {
      hasMore = Boolean(response.data?.next) && orders.length > 0;
      page += 1;
    }
  }

  return income;
}

async function loadDashboardData() {
  loading.value = true;
  loadError.value = '';
  stats.value = {
    total_orders: null,
    active_orders: null,
    pending_orders: null,
    today_income: null,
  };

  try {
    const [ordersResponse, statusResponses, todayIncome] = await Promise.all([
      fetchOrdersPage({ page: 1 }),
      Promise.all(
        [...new Set(['pending', ...activeOrderStatuses])].map(status =>
          fetchOrdersPage({ page: 1, page_size: 1, status })
        )
      ),
      fetchTodayIncome(),
    ]);

    const countByStatus = new Map(
      [...new Set(['pending', ...activeOrderStatuses])].map((status, index) => [
        status,
        getOrderCount(statusResponses[index]),
      ])
    );

    stats.value = {
      total_orders: getOrderCount(ordersResponse),
      active_orders: activeOrderStatuses.reduce(
        (total, status) => total + countByStatus.get(status),
        0
      ),
      pending_orders: countByStatus.get('pending'),
      today_income: todayIncome,
    };
    recentOrders.value = getOrdersList(ordersResponse).slice(0, 5);
  } catch (error) {
    console.error('Error al cargar los datos del dashboard:', error);
    loadError.value = error.response?.data?.detail
      || error.response?.data?.message
      || error.message
      || 'No se pudieron cargar los datos del dashboard.';
    recentOrders.value = [];
  } finally {
    loading.value = false;
  }
}

function displayStat(value) {
  return value === null ? '—' : new Intl.NumberFormat('es-MX').format(value);
}

function formatCurrency(value) {
  if (value === null) return '—';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatOrderDate(value) {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function statusLabel(status) {
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
  return labels[status] || status || 'Sin estado';
}

const userFullName = computed(() => {
  const user = authStore.user;
  if (user?.full_name) return user.full_name;
  if (user?.first_name) return `${user.first_name} ${user.last_name || ''}`;
  return user?.username || 'Usuario';
});

const restaurant = computed(() => authStore.restaurant);

onMounted(loadDashboardData);
</script>

<style scoped>
.dashboard {
  padding: 1rem;
}

.push-banner {
  margin-bottom: 1.5rem;
}

.welcome-banner {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.welcome-content h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.welcome-content p {
  color: #6b7280;
  margin: 0.5rem 0 0;
}

.stat-chip {
  background: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-green { color: #22c55e; }
.text-yellow { color: #f59e0b; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

.text-white { color: white; }

.dashboard-error {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  margin-bottom: 1.25rem;
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 0.9rem;
}

.dashboard-error span {
  flex: 1;
}

.dashboard-error button {
  padding: 0.45rem 0.75rem;
  color: #991b1b;
  background: white;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.quick-actions h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.action-card:hover {
  background: #f3f4f6;
  border-color: var(--color-primary-2);
  transform: translateY(-2px);
}

.action-card i {
  font-size: 2rem;
  color: var(--color-primary-2);
  display: block;
  margin-bottom: 0.5rem;
}

.action-card span {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.recent-orders {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.text-btn {
  background: none;
  border: none;
  color: var(--color-primary-2);
  font-weight: 500;
  cursor: pointer;
  font-size: 0.875rem;
}

.text-btn:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: #6b7280;
}

.empty-state i {
  font-size: 3rem;
  color: #d1d5db;
  display: block;
  margin-bottom: 1rem;
}

.empty-state p {
  font-size: 1rem;
  margin: 0;
}

.empty-state span {
  font-size: 0.875rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2rem;
  color: #6b7280;
}

.orders-list {
  display: grid;
}

.order-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 0.25rem;
  color: inherit;
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #f0f0f3;
  cursor: pointer;
  font: inherit;
}

.order-item:last-child {
  border-bottom: 0;
}

.order-item:hover .order-id {
  color: var(--color-primary-2);
}

.order-main,
.order-summary {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.order-main {
  min-width: 0;
}

.order-id {
  color: #25243a;
  font-weight: 700;
  white-space: nowrap;
}

.order-client,
.order-time {
  overflow: hidden;
  color: #6b7280;
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-time {
  font-size: 0.78rem;
}

.order-summary {
  flex: 0 0 auto;
  color: #25243a;
}

.order-status {
  padding: 0.3rem 0.55rem;
  color: #92400e;
  background: #fffbeb;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.order-status.status-confirmed,
.order-status.status-in_delivery {
  color: #1d4ed8;
  background: #eff6ff;
}

.order-status.status-preparing,
.order-status.status-ready {
  color: #6d28d9;
  background: #f5f3ff;
}

.order-status.status-delivered {
  color: #166534;
  background: #f0fdf4;
}

.order-status.status-cancelled,
.order-status.status-rejected {
  color: #991b1b;
  background: #fef2f2;
}

@media (max-width: 700px) {
  .order-item,
  .order-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-main,
  .order-summary {
    gap: 0.45rem;
  }

  .order-item {
    flex-direction: row;
    align-items: center;
  }

  .order-main {
    min-width: 0;
  }

  .order-summary {
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>