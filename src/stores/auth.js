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
            current_location_lat: userData.current_location_lat ?? userData.latitude ?? userData.latitud ?? null,
            current_location_lng: userData.current_location_lng ?? userData.longitude ?? userData.longitud ?? null,
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
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      token.value = storedToken;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    const storedRestaurant = localStorage.getItem('restaurant');
    if (storedRestaurant) {
      try {
        restaurant.value = JSON.parse(storedRestaurant);
      } catch (e) {
        console.error('Error parsing restaurant data:', e);
      }
    }
    return !!token.value;
  }

  async function updateRestaurantProfile(profileData) {
    const response = await api.patch('/users/profile/', profileData);
    const responseUser = response.data?.user || response.data?.profile || response.data;
    const updatedUser = { ...user.value, ...responseUser, ...profileData };

    user.value = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));

    restaurant.value = {
      ...restaurant.value,
      id: updatedUser.id,
      name: updatedUser.restaurant_name || restaurant.value?.name,
      description: updatedUser.restaurant_description ?? restaurant.value?.description ?? '',
      address: updatedUser.restaurant_address || restaurant.value?.address,
      phone: updatedUser.restaurant_phone || updatedUser.phone || restaurant.value?.phone,
      is_verified: updatedUser.is_restaurant_verified ?? restaurant.value?.is_verified,
      profile_image: updatedUser.profile_image || restaurant.value?.profile_image,
      current_location_lat: updatedUser.current_location_lat ?? updatedUser.latitude ?? updatedUser.latitud ?? profileData.current_location_lat ?? restaurant.value?.current_location_lat,
      current_location_lng: updatedUser.current_location_lng ?? updatedUser.longitude ?? updatedUser.longitud ?? profileData.current_location_lng ?? restaurant.value?.current_location_lng,
    };
    localStorage.setItem('restaurant', JSON.stringify(restaurant.value));

    return updatedUser;
  }

  async function changePassword(passwordData) {
    const response = await api.post('/users/change-password/', {
      old_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword,
    });

    return response.data;
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
    updateRestaurantProfile,
    changePassword,
  };
});