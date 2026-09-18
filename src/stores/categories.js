import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useCategoriesStore = defineStore('categories', () => {
  // Estado
  const categories = ref([]);
  const currentCategory = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 10,
  });

  // Getters
  const activeCategories = computed(() => 
    categories.value.filter(cat => cat.is_active)
  );

  const inactiveCategories = computed(() => 
    categories.value.filter(cat => !cat.is_active)
  );

  const orderedCategories = computed(() => 
    [...categories.value].sort((a, b) => (a.order || 0) - (b.order || 0))
  );

  // Acciones
  async function fetchCategories(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get('/products/restaurant-categories/', {
        params: {
          page: params.page || 1,
          page_size: params.pageSize || 10,
          ...params
        }
      });
      
      categories.value = response.data.results || response.data;
      if (response.data.count) {
        pagination.value = {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        };
      }
      
      return categories.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar categorías';
      console.error('Error fetching categories:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCategory(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/products/restaurant-categories/${id}/`);
      currentCategory.value = response.data;
      return currentCategory.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar categoría';
      console.error('Error fetching category:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createCategory(categoryData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/products/restaurant-categories/', categoryData);
      categories.value.unshift(response.data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al crear categoría';
      console.error('Error creating category:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateCategory(id, categoryData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.put(`/products/restaurant-categories/${id}/`, categoryData);
      const index = categories.value.findIndex(cat => cat.id === id);
      if (index !== -1) {
        categories.value[index] = response.data;
      }
      if (currentCategory.value?.id === id) {
        currentCategory.value = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al actualizar categoría';
      console.error('Error updating category:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCategory(id) {
    loading.value = true;
    error.value = null;
    
    try {
      await api.delete(`/products/restaurant-categories/${id}/`);
      categories.value = categories.value.filter(cat => cat.id !== id);
      if (currentCategory.value?.id === id) {
        currentCategory.value = null;
      }
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar categoría';
      console.error('Error deleting category:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleCategoryStatus(id) {
    const category = categories.value.find(cat => cat.id === id);
    if (!category) return;
    
    try {
      const response = await api.patch(`/products/restaurant-categories/${id}/`, {
        is_active: !category.is_active
      });
      const index = categories.value.findIndex(cat => cat.id === id);
      if (index !== -1) {
        categories.value[index] = response.data;
      }
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cambiar estado';
      console.error('Error toggling category status:', err);
      throw err;
    }
  }

  function resetCurrentCategory() {
    currentCategory.value = null;
  }

  function clearError() {
    error.value = null;
  }

  return {
    // Estado
    categories,
    currentCategory,
    loading,
    error,
    pagination,
    
    // Getters
    activeCategories,
    inactiveCategories,
    orderedCategories,
    
    // Acciones
    fetchCategories,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    resetCurrentCategory,
    clearError,
  };
});