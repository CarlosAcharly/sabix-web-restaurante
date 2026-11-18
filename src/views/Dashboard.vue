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

    <section class="income-report" aria-labelledby="income-report-title">
      <div class="income-report-header">
        <div>
          <h2 id="income-report-title">Ganancias por pedidos pagados y entregados</h2>
          <p>Se muestra la ganancia del restaurante según la fecha de entrega.</p>
        </div>
        <label class="period-filter">
          <span>Periodo</span>
          <select v-model="incomePeriod" aria-label="Periodo del reporte de ingresos">
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
          </select>
        </label>
      </div>

      <div class="income-summary">
        <div>
          <span class="income-total">{{ formatCurrency(incomeReport.total) }}</span>
          <span class="income-caption">Ganancia del periodo</span>
        </div>
        <div>
          <span class="income-order-count">{{ displayStat(incomeReport.orderCount) }}</span>
          <span class="income-caption">Pedidos pagados y entregados</span>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando reporte de ingresos...</span>
      </div>
      <div v-else-if="incomeReport.orderCount === 0" class="income-empty">
        No hay pedidos pagados y entregados en este periodo.
      </div>
      <div v-else class="income-chart-container">
        <div class="income-chart" :class="{ 'income-chart-month': incomeDays.length > 7 }">
          <div
            v-for="day in incomeDays"
            :key="day.key"
            class="income-chart-column"
            :title="`${day.label}: ${formatCurrency(day.total)} (${day.orderCount} pedidos)`"
          >
            <span class="income-bar-value">{{ formatCurrency(day.total) }}</span>
            <div class="income-bar-track">
              <div
                class="income-bar"
                :style="{ height: `${incomeBarHeight(day.total)}%` }"
                role="img"
                :aria-label="`${day.label}: ${formatCurrency(day.total)}`"
              ></div>
            </div>
            <span class="income-bar-label">{{ day.label }}</span>
          </div>
        </div>
      </div>
      <p v-if="incomeReport.undatedOrderCount" class="income-note">
        {{ incomeReport.undatedOrderCount }} pedido(s) pagado(s) y entregado(s) no tienen fecha de entrega y no se incluyen en el reporte.
      </p>
      <p v-if="incomeReport.missingEarningsCount" class="income-note">
        {{ incomeReport.missingEarningsCount }} pedido(s) pagado(s) no incluyen la ganancia del restaurante y no se sumaron.
      </p>
    </section>

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
const deliveredOrders = ref([]);
const incomePeriod = ref('7');
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

async function fetchDeliveredOrders() {
  let page = 1;
  const deliveredOrders = [];
  let hasMore;

  do {
    const response = await fetchOrdersPage({ page, status: 'delivered' });
    const orders = getOrdersList(response);
    deliveredOrders.push(...orders);
    hasMore = Boolean(response.data?.next) && orders.length > 0;
    page += 1;
  } while (hasMore);

  return deliveredOrders;
}

async function loadDashboardData() {
  loading.value = true;
  loadError.value = '';
  deliveredOrders.value = [];
  stats.value = {
    total_orders: null,
    active_orders: null,
    pending_orders: null,
    today_income: null,
  };

  try {
    const [ordersResponse, statusResponses, fetchedDeliveredOrders] = await Promise.all([
      fetchOrdersPage({ page: 1 }),
      Promise.all(
        [...new Set(['pending', ...activeOrderStatuses])].map(status =>
          fetchOrdersPage({ page: 1, page_size: 1, status })
        )
      ),
      fetchDeliveredOrders(),
    ]);

    const countByStatus = new Map(
      [...new Set(['pending', ...activeOrderStatuses])].map((status, index) => [
        status,
        getOrderCount(statusResponses[index]),
      ])
    );

    deliveredOrders.value = fetchedDeliveredOrders;
    stats.value = {
      total_orders: getOrderCount(ordersResponse),
      active_orders: activeOrderStatuses.reduce(
        (total, status) => total + countByStatus.get(status),
        0
      ),
      pending_orders: countByStatus.get('pending'),
      today_income: todayIncome.value,
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

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDeliveredDate(order) {
  if (!order.delivered_at) return null;
  const date = new Date(order.delivered_at);
  return Number.isNaN(date.getTime()) ? null : date;
}

const incomeReport = computed(() => {
  const days = Number(incomePeriod.value);
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  startDate.setDate(startDate.getDate() - days + 1);
  const startKey = getLocalDateKey(startDate);
  const endKey = getLocalDateKey(today);
  let total = 0;
  let orderCount = 0;
  let undatedOrderCount = 0;
  let missingEarningsCount = 0;

  for (const order of deliveredOrders.value) {
    if (!order.is_paid) continue;
    const deliveredDate = getDeliveredDate(order);
    if (!deliveredDate) {
      undatedOrderCount += 1;
      continue;
    }

    const dateKey = getLocalDateKey(deliveredDate);
    if (dateKey < startKey || dateKey > endKey) continue;

    const earnings = getRestaurantEarnings(order);
    if (earnings === null) {
      missingEarningsCount += 1;
      continue;
    }

    total += earnings;
    orderCount += 1;
  }

  return { total, orderCount, undatedOrderCount, missingEarningsCount };
});

const incomeDays = computed(() => {
  const days = Number(incomePeriod.value);
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  firstDay.setDate(firstDay.getDate() - days + 1);

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    return {
      key: getLocalDateKey(date),
      label: new Intl.DateTimeFormat('es-MX', {
        day: 'numeric',
        month: days === 7 ? 'short' : undefined,
      }).format(date),
      total: 0,
      orderCount: 0,
    };
  });
  const bucketsByDate = new Map(buckets.map(bucket => [bucket.key, bucket]));

  for (const order of deliveredOrders.value) {
    if (!order.is_paid) continue;
    const date = getDeliveredDate(order);
    if (!date) continue;

    const bucket = bucketsByDate.get(getLocalDateKey(date));
    if (!bucket) continue;

    const earnings = getRestaurantEarnings(order);
    if (earnings === null) continue;

    bucket.total += earnings;
    bucket.orderCount += 1;
  }

  return buckets;
});

const todayIncome = computed(() => {
  const todayKey = getLocalDateKey(new Date());
  return deliveredOrders.value.reduce((total, order) => {
    if (!order.is_paid) return total;
    const date = getDeliveredDate(order);
    if (!date || getLocalDateKey(date) !== todayKey) return total;
    const earnings = getRestaurantEarnings(order);
    return earnings === null ? total : total + earnings;
  }, 0);
});

function getRestaurantEarnings(order) {
  if (order.restaurant_earnings === null || order.restaurant_earnings === undefined) {
    return null;
  }
  const earnings = Number(order.restaurant_earnings);
  return Number.isFinite(earnings) ? earnings : null;
}

function incomeBarHeight(value) {
  const maxTotal = Math.max(...incomeDays.value.map(day => day.total), 0);
  if (maxTotal === 0 || value === 0) return 0;
  return Math.max((value / maxTotal) * 100, 4);
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
    assigned: 'Esperando respuesta del repartidor',
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

.income-report {
  margin-bottom: 2rem;
  padding: 1.5rem;
  overflow: hidden;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.income-report-header,
.income-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.income-report-header h2 {
  margin: 0;
  color: #1a1a2e;
  font-size: 1.1rem;
  font-weight: 600;
}

.income-report-header p {
  margin: 0.4rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.period-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.period-filter select {
  padding: 0.55rem 0.7rem;
  color: #374151;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font: inherit;
}

.income-summary {
  justify-content: flex-start;
  gap: 3rem;
  margin: 1.5rem 0 1rem;
}

.income-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.income-total,
.income-order-count {
  color: #1a1a2e;
  font-size: 1.5rem;
  font-weight: 700;
}

.income-caption {
  color: #6b7280;
  font-size: 0.8rem;
}

.income-chart {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: end;
  min-height: 190px;
  padding-top: 1rem;
}

.income-chart-container {
  overflow-x: auto;
}

.income-chart-month {
  grid-template-columns: repeat(30, minmax(28px, 1fr));
  min-width: 900px;
}

.income-chart-column {
  display: flex;
  min-width: 0;
  height: 190px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
}

.income-bar-value {
  overflow: hidden;
  width: 100%;
  color: #6b7280;
  font-size: 0.68rem;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.income-bar-track {
  display: flex;
  width: 100%;
  height: 130px;
  align-items: flex-end;
  justify-content: center;
  border-bottom: 1px solid #e5e7eb;
}

.income-bar {
  width: min(100%, 44px);
  min-height: 0;
  background: linear-gradient(180deg, #34d399, #16a34a);
  border-radius: 6px 6px 0 0;
  transition: height 0.2s ease;
}

.income-bar-label {
  color: #6b7280;
  font-size: 0.72rem;
  white-space: nowrap;
}

.income-empty {
  padding: 2rem 0;
  color: #6b7280;
  text-align: center;
}

.income-note {
  margin: 0.75rem 0 0;
  color: #92400e;
  font-size: 0.8rem;
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
  .income-report-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .income-summary {
    gap: 1.5rem;
  }

  .income-total,
  .income-order-count {
    font-size: 1.25rem;
  }

  .income-chart {
    gap: 0.35rem;
  }

  .income-bar-value {
    font-size: 0.6rem;
  }

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