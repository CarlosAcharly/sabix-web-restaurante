<template>
  <div class="layout-container">
    <header class="header glass">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            <i class="pi pi-store"></i>
          </div>
          <div class="logo-text">
            <span class="restaurant-name">{{ restaurantName }}</span>
            <div class="logo-badges">
              <Tag 
                v-if="authStore.restaurant?.is_verified" 
                value="Verificado" 
                severity="success" 
                size="small" 
              />
              <Tag 
                v-else 
                value="Pendiente" 
                severity="warning" 
                size="small" 
              />
            </div>
          </div>
        </div>
        <div class="header-actions">
          <span class="online-status" :class="{ 'online': isOnline }">
            <span class="status-dot"></span>
            {{ isOnline ? 'En línea' : 'Desconectado' }}
          </span>
          
          <NotificationBell />
          
          <div class="user-info">
            <Avatar 
              :image="authStore.user?.profile_image" 
              :label="getInitials()" 
              shape="circle" 
              size="small"
              class="user-avatar"
            />
            <div class="user-details">
              <span class="user-name">{{ authStore.user?.full_name || authStore.user?.username }}</span>
              <span class="user-role">Restaurante</span>
            </div>
          </div>
          <Button
            icon="pi pi-chevron-down"
            severity="secondary"
            text
            class="menu-toggle"
            @click="toggleUserMenu"
          />
          <Menu ref="userMenu" :model="userMenuItems" popup class="user-menu" />
        </div>
      </div>
    </header>

    <div class="main-layout">
      <aside class="sidebar glass">
        <SidebarMenu />
      </aside>
      <main class="content glass">
        <router-view />
      </main>
    </div>

    <Toast position="top-right" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import Button from 'primevue/button';
import Menu from 'primevue/menu';
import Avatar from 'primevue/avatar';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import SidebarMenu from '@/components/layout/SidebarMenu.vue';
import NotificationBell from '@/components/notifications/NotificationBell.vue';
import pollingService from '@/services/polling';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const toast = useToast();

const isOnline = ref(true);
const pendingNotifications = ref(0);

const restaurantName = computed(() => {
  return authStore.restaurant?.name || authStore.user?.restaurant_name || 'Mi Restaurante';
});

const userMenuItems = ref([
  { 
    label: 'Mi Perfil', 
    icon: 'pi pi-user', 
    command: () => router.push('/profile')
  },
  { 
    label: 'Configuración', 
    icon: 'pi pi-cog', 
    command: () => router.push('/settings')
  },
  { 
    label: 'Notificaciones', 
    icon: 'pi pi-bell', 
    command: () => router.push('/notifications')
  },
  { separator: true },
  { 
    label: 'Cerrar Sesión', 
    icon: 'pi pi-sign-out', 
    command: () => authStore.logout() 
  },
]);

const userMenu = ref();

function toggleUserMenu(event) {
  userMenu.value.toggle(event);
}

function getInitials() {
  const user = authStore.user;
  if (!user) return 'U';
  if (user.full_name) {
    const parts = user.full_name.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
  }
  return user.username ? user.username[0].toUpperCase() : 'U';
}

// ============================================
// POLLING PARA NOTIFICACIONES
// ============================================
function setupPolling() {
  const user = authStore.user;
  
  if (user) {
    console.log(`🔄 Iniciando polling para usuario ID: ${user.id}`);
    
    // Iniciar polling
    pollingService.start(user.id);
    
    // Escuchar nuevas notificaciones
    pollingService.on('new_notifications', (data) => {
      console.log(`📩 ${data.newCount} nuevas notificaciones detectadas`);
      
      // Actualizar contador
      pendingNotifications.value = data.count;
      
      // Mostrar toast
      toast.add({
        severity: 'info',
        summary: 'Nuevas notificaciones',
        detail: `Tienes ${data.newCount} notificación(es) nueva(s)`,
        life: 5000,
        group: 'br',
      });
      
      // Recargar notificaciones en el bell
      notificationsStore.fetchNotifications({ 
        page: 1, 
        pageSize: 10,
        is_read: false 
      });
    });
  }
}

async function loadUnreadCount() {
  try {
    await notificationsStore.fetchUnreadCount();
    pendingNotifications.value = notificationsStore.unreadCount;
  } catch (error) {
    console.error('Error loading unread count:', error);
  }
}

// 🔥 Watch para detectar cuando el usuario está disponible
watch(() => authStore.user, (newUser) => {
  console.log('👤 authStore.user cambió:', newUser);
  if (newUser) {
    // Detener polling anterior si existe
    if (pollingService.isActive) {
      pollingService.stop();
    }
    setupPolling();
  }
}, { immediate: true });

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  console.log('🏪 RestaurantLayout montado');
  loadUnreadCount();
  
  if (authStore.user) {
    setupPolling();
  } else {
    console.log('⏳ Esperando a que el usuario esté disponible...');
  }
});

onUnmounted(() => {
  console.log('🏪 RestaurantLayout desmontado');
  pollingService.stop();
});
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f4f0f7;
  padding: 1.5rem;
  gap: 1.5rem;
}

/* ============================================
   HEADER
   ============================================ */
.header {
  padding: 0.75rem 1.5rem;
  height: 70px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  position: relative;
  z-index: 100;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Logo Section */
.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.3rem;
  box-shadow: 0 4px 15px rgba(126, 9, 126, 0.25);
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.restaurant-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1a1a2e;
}

.logo-badges {
  display: flex;
  gap: 0.25rem;
}

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.online-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  padding: 0.35rem 1rem;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.04);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6b7280;
}

.online-status.online .status-dot {
  background: #22c55e;
}

.online-status.online {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  border-radius: 30px;
  background: rgba(0, 0, 0, 0.03);
  transition: all 0.2s;
  cursor: pointer;
}

.user-info:hover {
  background: rgba(0, 0, 0, 0.06);
}

.user-avatar {
  border: 2px solid var(--color-primary-3);
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a2e;
}

.user-role {
  font-size: 0.7rem;
  color: #6b7280;
}

.menu-toggle {
  color: #6b7280 !important;
  padding: 0.25rem !important;
}

.menu-toggle:hover {
  color: #1a1a2e !important;
}

/* ============================================
   MAIN LAYOUT
   ============================================ */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1.5rem;
}

.sidebar {
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  padding: 0.5rem 0;
  position: relative;
  z-index: 10;
}

.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--color-primary-3);
  border-radius: 2px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  position: relative;
  z-index: 1;
}

.content::-webkit-scrollbar {
  width: 6px;
}

.content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 3px;
}

.content::-webkit-scrollbar-thumb {
  background: var(--color-primary-3);
  border-radius: 3px;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 992px) {
  .layout-container {
    padding: 1rem;
    gap: 1rem;
  }
  
  .main-layout {
    gap: 1rem;
  }
  
  .sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .layout-container {
    padding: 0.75rem;
    gap: 0.75rem;
  }
  
  .header {
    padding: 0.5rem 1rem;
    height: 60px;
  }
  
  .main-layout {
    gap: 0.75rem;
  }
  
  .sidebar {
    width: 200px;
  }
  
  .content {
    padding: 1rem;
  }
  
  .online-status {
    display: none;
  }
  
  .user-details {
    display: none;
  }
  
  .user-info {
    padding: 0.25rem;
    border-radius: 50%;
  }
  
  .logo-text .restaurant-name {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .layout-container {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .header {
    padding: 0.4rem 0.75rem;
    height: 54px;
  }
  
  .sidebar {
    width: 60px;
  }
  
  .main-layout {
    gap: 0.5rem;
  }
  
  .content {
    padding: 0.75rem;
  }
  
  .logo-text .restaurant-name {
    display: none;
  }
  
  .logo-badges {
    display: none;
  }
  
  .header-actions {
    gap: 0.5rem;
  }
}
</style>