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

    <div class="stats-grid">
      <div class="stat-card" style="background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);">
        <div class="stat-icon">
          <i class="pi pi-shopping-cart"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">{{ stats.total_orders || 0 }}</span>
          <span class="stat-label text-white">Total Pedidos</span>
        </div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);">
        <div class="stat-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">{{ stats.active_orders || 0 }}</span>
          <span class="stat-label text-white">Pedidos Activos</span>
        </div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <div class="stat-icon">
          <i class="pi pi-clock"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">{{ stats.pending_orders || 0 }}</span>
          <span class="stat-label text-white">Pendientes</span>
        </div>
      </div>
      
      <div class="stat-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
        <div class="stat-icon">
          <i class="pi pi-dollar"></i>
        </div>
        <div class="stat-content">
          <span class="stat-value text-white">${{ stats.today_income || 0 }}</span>
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
      
      <div class="empty-state" v-if="recentOrders.length === 0">
        <i class="pi pi-inbox"></i>
        <p>No hay pedidos recientes</p>
        <span>Los pedidos aparecerán aquí cuando lleguen</span>
      </div>
      
      <div v-else class="orders-list">
        <div v-for="order in recentOrders" :key="order.id" class="order-item">
          <!-- Contenido del pedido -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import PushPermission from '@/components/notifications/PushPermission.vue';

const router = useRouter();
const authStore = useAuthStore();

const stats = ref({
  total_orders: 0,
  active_orders: 0,
  pending_orders: 0,
  today_income: 0,
});

const recentOrders = ref([]);

const userFullName = computed(() => {
  const user = authStore.user;
  if (user?.full_name) return user.full_name;
  if (user?.first_name) return `${user.first_name} ${user.last_name || ''}`;
  return user?.username || 'Usuario';
});

const restaurant = computed(() => authStore.restaurant);

onMounted(() => {
  console.log('Dashboard loaded');
  // Aquí cargarías datos reales desde tu API
  // loadDashboardData();
});
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
</style>