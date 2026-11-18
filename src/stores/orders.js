import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

export const useOrdersStore = defineStore('orders', () => {
  // Estado
  const orders = ref([]);
  const currentOrder = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const filters = ref({
    status: '',
    page: 1,
    pageSize: 20,
  });
  const pagination = ref({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 20,
  });
  const stats = ref({
    pending_count: 0,
    confirmed_count: 0,
    preparing_count: 0,
    ready_count: 0,
    assigned_count: 0,
    in_delivery_count: 0,
    delivered_count: 0,
    cancelled_count: 0,
    rejected_count: 0,
    total_count: 0,
  });

  // Getters
  const pendingOrders = computed(() => 
    orders.value.filter(o => o.status === 'pending')
  );
  
  const activeOrders = computed(() => 
    orders.value.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status))
  );

  const ordersByStatus = computed(() => {
    const grouped = {};
    orders.value.forEach(order => {
      if (!grouped[order.status]) {
        grouped[order.status] = [];
      }
      grouped[order.status].push(order);
    });
    return grouped;
  });

  function getRestaurantCoordinates() {
    const authStore = useAuthStore();
    const sources = [
      authStore.restaurant,
      authStore.user?.restaurant,
      authStore.user,
    ].filter(Boolean);

    const findCoordinate = (keys) => {
      for (const source of sources) {
        for (const key of keys) {
          const value = source[key];
          if (value !== undefined && value !== null && value !== '') {
            return Number(value);
          }
        }
      }
      return NaN;
    };

    const latitude = findCoordinate(['current_location_lat', 'latitude', 'latitud']);
    const longitude = findCoordinate(['current_location_lng', 'longitude', 'longitud']);

    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { restaurant_lat: latitude, restaurant_lng: longitude }
      : {};
  }

  // Transiciones válidas
  function getValidTransitions(orderId) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return [];
    
    const validTransitions = {
      'pending': ['confirmed', 'cancelled', 'rejected'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready'],
      'ready': ['assigned'],
      'assigned': ['in_delivery'],
      'in_delivery': ['delivered'],
    };
    
    return validTransitions[order.status] || [];
  }

  function getStatusLabel(status) {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      preparing: 'En preparación',
      ready: 'Listo',
      assigned: 'Esperando respuesta del repartidor',
      in_delivery: 'En camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      rejected: 'Rechazado',
    };
    return labels[status] || status;
  }

  // Acciones
  async function fetchOrders(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const queryParams = {
        page: params.page || filters.value.page || 1,
        page_size: params.pageSize || filters.value.pageSize || 20,
        ...params,
      };
      
      // Limpiar parámetros vacíos
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await api.get('/orders/restaurant/orders/', { params: queryParams });
      
      orders.value = response.data.results || response.data || [];
      
      if (response.data.count !== undefined) {
        pagination.value = {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: params.page || 1,
          pageSize: params.pageSize || 20,
        };
      }
      
      calculateStats();
      
      return orders.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar pedidos';
      console.error('Error fetching orders:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrder(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/orders/restaurant/orders/${id}/`);
      currentOrder.value = response.data;
      return currentOrder.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar pedido';
      console.error('Error fetching order:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateOrderStatus(id, status) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.patch(`/orders/restaurant/orders/${id}/`, {
        status,
        ...(status === 'ready' ? getRestaurantCoordinates() : {}),
      });
      const updatedOrder = response.data.order || response.data;

      // Actualizar en la lista
      const index = orders.value.findIndex(o => o.id === id);
      if (index !== -1) {
        orders.value[index] = { ...orders.value[index], ...updatedOrder };
      }
      
      // Actualizar currentOrder
      if (currentOrder.value?.id === id) {
        currentOrder.value = { ...currentOrder.value, ...updatedOrder };
      }
      
      calculateStats();
      
      return response.data;
    } catch (err) {
      let errorMessage = 'Error al actualizar estado';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
          const firstKey = Object.keys(err.response.data)[0];
          if (firstKey && err.response.data[firstKey]) {
            const errorValue = err.response.data[firstKey];
            if (Array.isArray(errorValue)) {
              errorMessage = errorValue[0];
            } else if (typeof errorValue === 'string') {
              errorMessage = errorValue;
            } else {
              errorMessage = JSON.stringify(errorValue);
            }
          } else if (err.response.data.detail) {
            errorMessage = err.response.data.detail;
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message;
          } else if (err.response.data.error) {
            errorMessage = err.response.data.error;
          } else {
            errorMessage = JSON.stringify(err.response.data);
          }
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function autoAssignDelivery(orderId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/orders/delivery/auto-assign/', {
        order_id: orderId,
        ...getRestaurantCoordinates(),
      });
      const updatedOrder = response.data.order;

      const index = orders.value.findIndex(order => order.id === orderId);
      if (index !== -1 && updatedOrder) {
        orders.value[index] = { ...orders.value[index], ...updatedOrder };
      }

      if (currentOrder.value?.id === orderId && updatedOrder) {
        currentOrder.value = { ...currentOrder.value, ...updatedOrder };
      }

      calculateStats();
      return response.data;
    } catch (err) {
      const responseData = err.response?.data;
      const firstValue = responseData && typeof responseData === 'object'
        ? responseData.detail || responseData.message || responseData.error || Object.values(responseData)[0]
        : responseData;
      const errorMessage = Array.isArray(firstValue)
        ? firstValue[0]
        : firstValue || err.message || 'Error al reintentar la asignación automática';

      error.value = String(errorMessage);
      throw new Error(error.value);
    } finally {
      loading.value = false;
    }
  }

  async function assignDelivery(orderId, deliveryPersonId) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/orders/delivery/assign/', {
        order_id: orderId,
        delivery_person_id: deliveryPersonId,
      });
      const updatedOrder = response.data.order || response.data;

      const index = orders.value.findIndex(order => order.id === orderId);
      if (index !== -1) {
        orders.value[index] = { ...orders.value[index], ...updatedOrder };
      }

      if (currentOrder.value?.id === orderId) {
        currentOrder.value = { ...currentOrder.value, ...updatedOrder };
      }

      calculateStats();
      return response.data;
    } catch (err) {
      console.error('Error asignando repartidor:', err);
      const responseData = err.response?.data;
      const firstValue = responseData && typeof responseData === 'object'
        ? responseData.detail || responseData.message || responseData.error || Object.values(responseData)[0]
        : responseData;
      const errorMessage = Array.isArray(firstValue)
        ? firstValue[0]
        : firstValue || err.message || 'Error al asignar repartidor';

      error.value = String(errorMessage);
      throw new Error(error.value);
    } finally {
      loading.value = false;
    }
  }
  async function findNearestDeliveryPeople(orderId, radius = 5, limit = 5) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/orders/delivery/find-nearest/', {
        order_id: orderId,
        ...getRestaurantCoordinates(),
        radius_km: radius,
        limit: limit,
      });
      return response.data;
    } catch (err) {
      const responseData = err.response?.data;
      const message = responseData && typeof responseData === 'object'
        ? responseData.error || responseData.detail || responseData.message
        : responseData;
      error.value = String(message || 'Error al buscar repartidores');
      console.error('Error finding nearest delivery people:', err);
      throw new Error(error.value);
    } finally {
      loading.value = false;
    }
  }

  // ✅ NUEVA FUNCIÓN: Obtener todos los repartidores disponibles
  async function fetchAllAvailableDeliveryPeople() {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get('/orders/delivery/all-available/');
      return response.data.results || response.data || [];
    } catch (err) {
      const responseData = err.response?.data;
      const message = responseData && typeof responseData === 'object'
        ? responseData.error || responseData.detail || responseData.message
        : responseData;
      error.value = String(message || 'Error al cargar repartidores');
      console.error('Error fetching all delivery people:', err);
      throw new Error(error.value);
    } finally {
      loading.value = false;
    }
  }

  function calculateStats() {
    stats.value = {
      pending_count: orders.value.filter(o => o.status === 'pending').length,
      confirmed_count: orders.value.filter(o => o.status === 'confirmed').length,
      preparing_count: orders.value.filter(o => o.status === 'preparing').length,
      ready_count: orders.value.filter(o => o.status === 'ready').length,
      assigned_count: orders.value.filter(o => o.status === 'assigned').length,
      in_delivery_count: orders.value.filter(o => o.status === 'in_delivery').length,
      delivered_count: orders.value.filter(o => o.status === 'delivered').length,
      cancelled_count: orders.value.filter(o => o.status === 'cancelled').length,
      rejected_count: orders.value.filter(o => o.status === 'rejected').length,
      total_count: orders.value.length,
    };
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      status: '',
      page: 1,
      pageSize: 20,
    };
  }

  function resetCurrentOrder() {
    currentOrder.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // Estado
    orders,
    currentOrder,
    loading,
    error,
    filters,
    pagination,
    stats,
    
    // Getters
    pendingOrders,
    activeOrders,
    ordersByStatus,
    
    // Transiciones
    getValidTransitions,
    getStatusLabel,
    
    // Acciones
    fetchOrders,
    fetchOrder,
    updateOrderStatus,
    autoAssignDelivery,
    assignDelivery,
    findNearestDeliveryPeople,
    fetchAllAvailableDeliveryPeople, // ✅ Nueva acción
    setFilters,
    resetFilters,
    resetCurrentOrder,
    clearError,
  };
});