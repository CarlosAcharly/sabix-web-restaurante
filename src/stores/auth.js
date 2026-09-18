import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const refreshToken = ref(localStorage.getItem('refresh_token') || null);
  const user = ref(null);
  const restaurant = ref(null);

  const isAuthenticated = computed(() => !!token.value);
  const isRestaurant = computed(() => user.value?.user_type === 'restaurant');

  async function login(credentials) {
    try {
      const response = await api.post('/users/login/restaurant-web/', credentials);
      
      if (response.data) {
        const { access, refresh, user: userData } = response.data;
        
        token.value = access;
        refreshToken.value = refresh;
        user.value = userData;
        
        localStorage.setItem('token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (userData.user_type === 'restaurant') {
          restaurant.value = {
            id: userData.id,
            name: userData.restaurant_name,
            description: userData.restaurant_description,
            address: userData.restaurant_address,
            phone: userData.restaurant_phone || userData.phone,
            is_verified: userData.is_restaurant_verified,
            profile_image: userData.profile_image,
          };
          localStorage.setItem('restaurant', JSON.stringify(restaurant.value));
        }
        
        return { success: true };
      }
      
      return { success: false, error: 'No se recibieron datos del servidor' };
    } catch (error) {
      console.error('Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      if (error.response?.data?.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { success: false, error: errorMessage };
    }
  }

  function logout() {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    restaurant.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('restaurant');
    window.location.href = '/login';
  }

  async function checkAuth() {
    if (!token.value) {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        token.value = storedToken;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            user.value = JSON.parse(storedUser);
            const storedRestaurant = localStorage.getItem('restaurant');
            if (storedRestaurant) {
              restaurant.value = JSON.parse(storedRestaurant);
            }
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
    }
    return !!token.value;
  }

  return {
    token,
    refreshToken,
    user,
    restaurant,
    isAuthenticated,
    isRestaurant,
    login,
    logout,
    checkAuth,
  };
});