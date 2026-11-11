<template>
  <div class="sidebar-menu">
    <div class="sidebar-brand">
      <div class="brand-icon">
        <i class="pi pi-store"></i>
      </div>
      <span class="brand-text">Sabix</span>
      <span class="brand-version">v1.0</span>
    </div>
    
    <nav class="menu-nav">
      <router-link to="/" class="menu-item" exact-active-class="active">
        <i class="pi pi-home menu-icon"></i>
        <span class="menu-label">Dashboard</span>
      </router-link>
      
      <router-link to="/orders" class="menu-item" active-class="active">
        <i class="pi pi-shopping-cart menu-icon"></i>
        <span class="menu-label">Pedidos</span>
        <span v-if="pendingOrders > 0" class="badge">{{ pendingOrders }}</span>
      </router-link>
      
      <!-- Menú con submenú -->
      <div class="menu-section">
        <div 
          class="menu-item" 
          :class="{ 'active': isMenuActive }"
          @click="toggleSubmenu"
        >
          <i class="pi pi-list menu-icon"></i>
          <span class="menu-label">Menú</span>
          <i class="pi pi-chevron-down submenu-toggle" :class="{ 'rotated': showSubmenu }"></i>
        </div>
        
        <div v-show="showSubmenu" class="submenu">
          <router-link 
            to="/menu" 
            class="submenu-item" 
            active-class="active"
          >
            <i class="pi pi-th-large submenu-icon"></i>
            <span>Todos los productos</span>
          </router-link>
          
          <router-link 
            to="/menu/categories" 
            class="submenu-item" 
            active-class="active"
          >
            <i class="pi pi-tags submenu-icon"></i>
            <span>Categorías</span>
          </router-link>
          
          <router-link 
            to="/menu/create" 
            class="submenu-item" 
            active-class="active"
          >
            <i class="pi pi-plus-circle submenu-icon"></i>
            <span>Nuevo producto</span>
          </router-link>
          
          <router-link 
            to="/menu/categories/create" 
            class="submenu-item" 
            active-class="active"
          >
            <i class="pi pi-plus-circle submenu-icon"></i>
            <span>Nueva categoría</span>
          </router-link>
        </div>
      </div>
      
      <!-- Chat -->
      <router-link to="/chat" class="menu-item" active-class="active">
        <i class="pi pi-comments menu-icon"></i>
        <span class="menu-label">Chat</span>
        <span v-if="unreadMessages > 0" class="badge">{{ unreadMessages }}</span>
      </router-link>
      
      <router-link to="/notifications" class="menu-item" active-class="active">
        <i class="pi pi-bell menu-icon"></i>
        <span class="menu-label">Notificaciones</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </router-link>
      
      <router-link to="/profile" class="menu-item" active-class="active">
        <i class="pi pi-user menu-icon"></i>
        <span class="menu-label">Perfil</span>
      </router-link>
      
      <router-link to="/settings" class="menu-item" active-class="active">
        <i class="pi pi-cog menu-icon"></i>
        <span class="menu-label">Configuración</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="footer-divider"></div>
      <button class="logout-btn" @click="authStore.logout">
        <i class="pi pi-sign-out"></i>
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useChatStore } from '@/stores/chat';

const route = useRoute();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const chatStore = useChatStore();

const pendingOrders = ref(0);
const showSubmenu = ref(false);

// Contadores
const unreadCount = computed(() => notificationsStore.unreadCount);
const unreadMessages = computed(() => chatStore.totalUnread);

// Detectar si el menú está activo
const isMenuActive = computed(() => {
  const menuRoutes = ['/menu', '/menu/categories', '/menu/create', '/menu/categories/create'];
  return menuRoutes.some(path => route.path === path || route.path.startsWith('/menu/'));
});

if (isMenuActive.value) {
  showSubmenu.value = true;
}

// Observar cambios de ruta para mantener el submenú abierto
watch(() => route.path, (newPath) => {
  const menuRoutes = ['/menu', '/menu/categories', '/menu/create', '/menu/categories/create'];
  const isMenuRoute = menuRoutes.some(path => newPath === path || newPath.startsWith('/menu/'));
  
  if (isMenuRoute) {
    showSubmenu.value = true;
  }
});

function toggleSubmenu() {
  showSubmenu.value = !showSubmenu.value;
}

// Cargar contadores al montar
onMounted(() => {
  notificationsStore.fetchUnreadCount();
  chatStore.fetchTotalUnread();
});
</script>

<style scoped>
.sidebar-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0.5rem 0.75rem;
}

/* ============================================
   BRAND
   ============================================ */
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 0.5rem;
}

.brand-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  box-shadow: 0 4px 15px rgba(126, 9, 126, 0.2);
}

.brand-text {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a1a2e;
}

.brand-version {
  font-size: 0.6rem;
  font-weight: 600;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 0.1rem 0.5rem;
  border-radius: 20px;
  margin-left: auto;
}

/* ============================================
   MENU NAV
   ============================================ */
.menu-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.25rem 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  color: #6b7280;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 0.9rem;
}

.menu-icon {
  font-size: 1.1rem;
  width: 1.25rem;
  text-align: center;
  flex-shrink: 0;
  color: #9ca3af;
  transition: color 0.2s;
}

.menu-label {
  flex: 1;
  font-weight: 500;
}

.menu-item:hover {
  background: rgba(126, 9, 126, 0.06);
  color: #1a1a2e;
}

.menu-item:hover .menu-icon {
  color: var(--color-primary-2);
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(126, 9, 126, 0.08) 0%, rgba(188, 74, 185, 0.08) 100%);
  color: var(--color-primary-2);
  font-weight: 600;
}

.menu-item.active .menu-icon {
  color: var(--color-primary-2);
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 15%;
  bottom: 15%;
  width: 3px;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  border-radius: 0 4px 4px 0;
}

.badge {
  margin-left: auto;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
  font-size: 0.65rem;
  padding: 0.1rem 0.5rem;
  border-radius: 20px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.submenu-toggle {
  font-size: 0.75rem;
  transition: transform 0.3s ease;
  margin-left: auto;
  color: #9ca3af;
}

.submenu-toggle.rotated {
  transform: rotate(180deg);
}

/* ============================================
   SUBMENU
   ============================================ */
.menu-section {
  display: flex;
  flex-direction: column;
}

.submenu {
  display: flex;
  flex-direction: column;
  padding-left: 1.5rem;
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  color: #6b7280;
  text-decoration: none;
  font-size: 0.82rem;
  border-radius: 8px;
  transition: all 0.2s;
  margin: 0.1rem 0;
}

.submenu-icon {
  font-size: 0.85rem;
  width: 1.25rem;
  text-align: center;
  color: #9ca3af;
  transition: color 0.2s;
}

.submenu-item:hover {
  background: rgba(126, 9, 126, 0.05);
  color: #1a1a2e;
}

.submenu-item:hover .submenu-icon {
  color: var(--color-primary-2);
}

.submenu-item.active {
  background: rgba(126, 9, 126, 0.07);
  color: var(--color-primary-2);
  font-weight: 600;
}

.submenu-item.active .submenu-icon {
  color: var(--color-primary-2);
}

/* ============================================
   FOOTER
   ============================================ */
.sidebar-footer {
  margin-top: auto;
  padding-top: 0.5rem;
}

.footer-divider {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(126, 9, 126, 0.15), transparent);
  margin-bottom: 0.75rem;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.1);
}

.logout-btn i {
  font-size: 1.1rem;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 768px) {
  .sidebar-menu {
    padding: 0.5rem 0.5rem;
  }
  
  .brand-text {
    font-size: 1rem;
  }
  
  .brand-version {
    display: none;
  }
  
  .menu-item {
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .sidebar-menu {
    padding: 0.25rem 0.25rem;
  }
  
  .sidebar-brand {
    padding: 0.25rem 0.25rem 0.75rem;
    justify-content: center;
  }
  
  .brand-text {
    display: none;
  }
  
  .brand-version {
    display: none;
  }
  
  .menu-item {
    padding: 0.5rem 0.4rem;
    justify-content: center;
    border-radius: 8px;
  }
  
  .menu-label {
    display: none;
  }
  
  .menu-icon {
    margin: 0;
    font-size: 1.2rem;
  }
  
  .badge {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 0.5rem;
    padding: 0.05rem 0.35rem;
    min-width: 16px;
  }
  
  .submenu-toggle {
    display: none;
  }
  
  .submenu {
    padding-left: 0;
  }
  
  .submenu-item {
    padding: 0.4rem 0.4rem;
    justify-content: center;
  }
  
  .submenu-item span {
    display: none;
  }
  
  .submenu-icon {
    font-size: 1rem;
    margin: 0;
  }
  
  .sidebar-footer {
    padding-top: 0.25rem;
  }
  
  .logout-btn span {
    display: none;
  }
  
  .logout-btn {
    justify-content: center;
    padding: 0.5rem;
  }
}
</style>