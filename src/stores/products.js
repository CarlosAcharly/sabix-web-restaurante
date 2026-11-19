import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useProductsStore = defineStore('products', () => {
  // Estado
  const products = ref([]);
  const currentProduct = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const filters = ref({
    search: '',
    category: null,
    is_available: null,
    is_featured: null,
    min_price: null,
    max_price: null,
    ordering: '-created_at',
  });
  const pagination = ref({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 10,
  });

  // Getters
  const availableProducts = computed(() => 
    products.value.filter(p => p.is_available)
  );

  const featuredProducts = computed(() => 
    products.value.filter(p => p.is_featured && p.is_available)
  );

  const totalProducts = computed(() => pagination.value.count);

  // Acciones
  async function fetchProducts(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const queryParams = {
        page: params.page || 1,
        page_size: params.pageSize || 10,
        ...filters.value,
        ...params,
      };
      
      // Limpiar parámetros nulos
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await api.get('/products/products/', { params: queryParams });
      
      products.value = response.data.results || response.data;
      if (response.data.count !== undefined) {
        pagination.value = {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        };
      }
      
      return products.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar productos';
      console.error('Error fetching products:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProduct(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/products/products/${id}/`);
      currentProduct.value = response.data;
      return currentProduct.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar producto';
      console.error('Error fetching product:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createProduct(productData, imageFile = null) {
    loading.value = true;
    error.value = null;
    
    try {
      let payload = productData;
      let config;

      if (imageFile) {
        const formData = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
        formData.append('image', imageFile);
        payload = formData;
        config = { headers: { 'Content-Type': false } };
      }

      const response = await api.post('/products/products/', payload, config);
      products.value.unshift(response.data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear producto';
      console.error('Error creating product:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateProduct(id, productData, imageFile = null) {
    loading.value = true;
    error.value = null;
    
    try {
      let payload = productData;
      let config;

      if (imageFile) {
        const formData = new FormData();
        Object.entries(productData).forEach(([key, value]) => {
          formData.append(key, value === null ? '' : value);
        });
        formData.append('image', imageFile);
        payload = formData;
        config = { headers: { 'Content-Type': false } };
      }

      const response = await api.put(`/products/products/${id}/`, payload, config);
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value[index] = response.data;
      }
      if (currentProduct.value?.id === id) {
        currentProduct.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar producto';
      console.error('Error updating product:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteProduct(id) {
    loading.value = true;
    error.value = null;
    
    try {
      await api.delete(`/products/products/${id}/`);
      products.value = products.value.filter(p => p.id !== id);
      if (currentProduct.value?.id === id) {
        currentProduct.value = null;
      }
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar producto';
      console.error('Error deleting product:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleProductAvailability(id) {
    const product = products.value.find(p => p.id === id);
    if (!product) return;
    
    try {
      const response = await api.patch(`/products/products/${id}/`, {
        is_available: !product.is_available
      });
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value[index] = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cambiar disponibilidad';
      console.error('Error toggling product availability:', err);
      throw err;
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      search: '',
      category: null,
      is_available: null,
      is_featured: null,
      min_price: null,
      max_price: null,
      ordering: '-created_at',
    };
  }

  function resetCurrentProduct() {
    currentProduct.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // Estado
    products,
    currentProduct,
    loading,
    error,
    filters,
    pagination,
    
    // Getters
    availableProducts,
    featuredProducts,
    totalProducts,
    
    // Acciones
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    setFilters,
    resetFilters,
    resetCurrentProduct,
    clearError,
  };
});