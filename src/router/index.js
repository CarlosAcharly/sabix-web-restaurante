import { createRouter, createWebHistory } from 'vue-router';

// Definir las rutas
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/RestaurantLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
      },
      // Agregar dentro de los children de '/'
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('@/views/chat/ChatView.vue'),
      },
      // Pedidos
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrdersList.vue'),
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
      },
      // Menú - Productos
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('@/views/menu/MenuList.vue'),
      },
      {
        path: 'menu/create',
        name: 'CreateProduct',
        component: () => import('@/views/menu/ProductForm.vue'),
      },
      {
        path: 'menu/:id/edit',
        name: 'EditProduct',
        component: () => import('@/views/menu/ProductForm.vue'),
      },
      {
        path: 'menu/:id',
        name: 'ProductDetail',
        component: () => import('@/views/menu/ProductDetail.vue'),
      },
      // Menú - Categorías
      {
        path: 'menu/categories',
        name: 'Categories',
        component: () => import('@/views/menu/CategoryList.vue'),
      },
      {
        path: 'menu/categories/create',
        name: 'CreateCategory',
        component: () => import('@/views/menu/CategoryForm.vue'),
      },
      {
        path: 'menu/categories/:id/edit',
        name: 'EditCategory',
        component: () => import('@/views/menu/CategoryForm.vue'),
      },
      // Perfil
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
      },
      // Configuración (placeholder)
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
      },
      {
      path: 'orders',
      name: 'Orders',
      component: () => import('@/views/orders/OrdersList.vue'),
      },
      {
      path: 'orders/:id',
      name: 'OrderDetail',
      component: () => import('@/views/orders/OrderDetail.vue'),
      },
      {
      path: 'notifications',
      name: 'Notifications',
      component: () => import('@/views/notifications/NotificationsView.vue'),
   },
    ],
  },
  // Ruta 404 - No encontrada
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guardia de navegación
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  // Verificar autenticación
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;