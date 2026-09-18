<template>
  <div class="verify-container">
    <div class="verify-card">
      <div class="verify-icon">
        <i class="pi pi-check-circle" v-if="verified"></i>
        <i class="pi pi-times-circle" v-else></i>
      </div>
      <h2>{{ verified ? '¡Email Verificado!' : 'Error de Verificación' }}</h2>
      <p>{{ message }}</p>
      <Button
        :label="verified ? 'Ir al Dashboard' : 'Volver al Login'"
        :icon="verified ? 'pi pi-arrow-right' : 'pi pi-arrow-left'"
        @click="redirect"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Button from 'primevue/button';
import api from '@/services/api';

const router = useRouter();
const route = useRoute();

const verified = ref(false);
const message = ref('');

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    message.value = 'Token de verificación no encontrado';
    return;
  }
  
  try {
    const response = await api.post('/users/verify-email/', { token });
    verified.value = true;
    message.value = response.data.message || 'Tu email ha sido verificado exitosamente';
  } catch (error) {
    verified.value = false;
    message.value = error.response?.data?.message || 'El token de verificación es inválido o ha expirado';
  }
});

function redirect() {
  if (verified.value) {
    router.push('/');
  } else {
    router.push('/login');
  }
}
</script>

<style scoped>
.verify-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.verify-card {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  text-align: center;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.verify-icon i {
  font-size: 4rem;
  color: #22c55e;
}

.verify-icon i.pi-times-circle {
  color: #ef4444;
}

.verify-card h2 {
  margin: 1rem 0 0.5rem;
  color: #1a1a2e;
}

.verify-card p {
  color: #6b7280;
  margin-bottom: 2rem;
}
</style>