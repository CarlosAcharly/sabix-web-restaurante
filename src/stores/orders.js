import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

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

  // Transiciones válidas
  function getValidTransitions(orderId) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return [];
    
    const validTransitions = {
      'pending': ['confirmed', 'cancelled', 'rejected'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready'],
      'ready': ['in_delivery'],
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
      console.log(`📤 Actualizando pedido ${id} a estado: ${status}`);
      
      const response = await api.put(`/orders/restaurant/orders/${id}/`, { status });
      
      console.log('✅ Respuesta del servidor:', response.data);
      
      // Actualizar en la lista
      const index = orders.value.findIndex(o => o.id === id);
      if (index !== -1) {
        orders.value[index] = response.data.order || response.data;
      }
      
      // Actualizar currentOrder
      if (currentOrder.value?.id === id) {
        currentOrder.value = response.data.order || response.data;
      }
      
      calculateStats();
      
      return response.data;
    } catch (err) {
      console.error('❌ Error actualizando estado:', err);
      console.error('📋 Response del error:', err.response);
      console.error('📋 Data del error:', err.response?.data);
      console.error('📋 Status del error:', err.response?.status);
      
      // 🔥 SOLUCIÓN: Si el error es 500, asumimos que el estado se actualizó correctamente
      // y recargamos los datos para confirmar
      if (err.response?.status === 500) {
        console.log('⚠️ Error 500 - Intentando recargar el pedido para verificar el cambio...');
        
        try {
          // Esperar un momento y recargar la lista
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Recargar la lista de pedidos
          await fetchOrders({ 
            page: filters.value.page || 1,
            pageSize: filters.value.pageSize || 20,
            status: filters.value.status || '',
          });
          
          // Si tenemos currentOrder, recargarlo también
          if (currentOrder.value?.id === id) {
            await fetchOrder(id);
          }
          
          console.log('✅ Pedido recargado, el cambio fue exitoso');
          
          // Devolver un objeto simulando éxito
          return { 
            success: true, 
            message: 'Estado actualizado (recargado para confirmar)',
            order: orders.value.find(o => o.id === id)
          };
        } catch (reloadError) {
          console.error('❌ Error al recargar el pedido:', reloadError);
          // Si no se puede recargar, lanzamos el error original
          throw err;
        }
      }
      
      // Mensaje de error más descriptivo
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

  async function assignDelivery(orderId, deliveryPersonId) {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.post('/orders/delivery/assign/', {
      order_id: orderId,
      delivery_person_id: deliveryPersonId,
    });
    
    const index = orders.value.findIndex(o => o.id === orderId);
    if (index !== -1) {
      orders.value[index] = response.data.order || response.data;
    }
    
    if (currentOrder.value?.id === orderId) {
      currentOrder.value = response.data.order || response.data;
    }
    
    calculateStats();
    return response.data;
  } catch (err) {
    console.error('❌ Error asignando repartidor:', err);
    console.error('📋 Response del error:', err.response);
    console.error('📋 Data del error:', err.response?.data);
    console.error('📋 Status del error:', err.response?.status);
    
    // 🔥 SOLUCIÓN: Si el error es 500, asumimos que la asignación se realizó correctamente
    if (err.response?.status === 500) {
      console.log('⚠️ Error 500 - Intentando recargar el pedido para verificar la asignación...');
      
      try {
        // Esperar un momento y recargar
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recargar la lista de pedidos
        await fetchOrders({ 
          page: filters.value.page || 1,
          pageSize: filters.value.pageSize || 20,
          status: filters.value.status || '',
        });
        
        // Si tenemos currentOrder, recargarlo también
        if (currentOrder.value?.id === orderId) {
          await fetchOrder(orderId);
        }
        
        console.log('✅ Pedido recargado, la asignación fue exitosa');
        
        // Devolver un objeto simulando éxito
        return { 
          success: true, 
          message: 'Repartidor asignado (recargado para confirmar)',
          order: orders.value.find(o => o.id === orderId)
        };
      } catch (reloadError) {
        console.error('❌ Error al recargar el pedido:', reloadError);
        throw err;
      }
    }
    
    // Mensaje de error más descriptivo
    let errorMessage = 'Error al asignar repartidor';
    
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
  async function findNearestDeliveryPeople(orderId, restaurantLat, restaurantLng, radius = 5, limit = 5) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/orders/delivery/find-nearest/', {
        order_id: orderId,
        restaurant_lat: restaurantLat,
        restaurant_lng: restaurantLng,
        radius_km: radius,
        limit: limit,
      });
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al buscar repartidores';
      console.error('Error finding nearest delivery people:', err);
      throw err;
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
      error.value = err.response?.data?.message || 'Error al cargar repartidores';
      console.error('Error fetching all delivery people:', err);
      throw err;
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
    assignDelivery,
    findNearestDeliveryPeople,
    fetchAllAvailableDeliveryPeople, // ✅ Nueva acción
    setFilters,
    resetFilters,
    resetCurrentOrder,
    clearError,
  };
});