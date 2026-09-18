<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-hero">
        <div class="hero-content">
          <div class="hero-badge">✦ PROFESSIONAL</div>
          <h1>Sabix Delivery</h1>
          <p>Panel de gestión para restaurantes. Administra tus pedidos, menú y más.</p>
          <div class="hero-features">
            <span class="feature-tag">✓ Gestión de pedidos</span>
            <span class="feature-tag">✓ Menú digital</span>
            <span class="feature-tag">✓ Reportes en tiempo real</span>
          </div>
        </div>
      </div>

      <div class="login-card glass">
        <div class="card-header">
          <div class="header-badge">
            <span class="badge-dot"></span>
            ACCESS
          </div>
          <h2>Iniciar Sesión</h2>
          <p>Ingresa tus credenciales para acceder al panel</p>
        </div>

        <div v-if="registerSuccess" class="success-message">
          <div class="message-icon">✓</div>
          <div>
            <strong>¡Registro exitoso!</strong>
            <p>Usuario <strong>{{ registeredUsername }}</strong> creado correctamente. Ahora puedes iniciar sesión.</p>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="username">
              <span>Usuario</span>
              <span class="validation-badge" :class="usernameValidation">
                {{ usernameValidation === 'valid' ? '✓ Validado' : usernameValidation === 'error' ? '✗ Error' : '' }}
              </span>
            </label>
            <div class="input-wrapper">
              <i class="pi pi-user input-icon"></i>
              <input
                id="username"
                v-model="form.username"
                type="text"
                placeholder="Ingresa tu usuario"
                class="form-input"
                :class="{ 'input-error': errors.username }"
                @focus="usernameValidation = ''"
                @blur="validateUsername"
              />
            </div>
            <small class="error-text" v-if="errors.username">{{ errors.username }}</small>
          </div>

          <div class="form-group">
            <label for="password">
              <span>Contraseña</span>
              <span class="validation-badge" :class="passwordValidation">
                {{ passwordValidation === 'valid' ? '✓ Segura' : passwordValidation === 'error' ? '✗ Error' : '' }}
              </span>
            </label>
            <div class="input-wrapper">
              <i class="pi pi-lock input-icon"></i>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Ingresa tu contraseña"
                class="form-input"
                :class="{ 'input-error': errors.password }"
                @focus="passwordValidation = ''"
                @blur="validatePassword"
              />
              <button 
                type="button" 
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'pi pi-eye' : 'pi pi-eye-slash'"></i>
              </button>
            </div>
            <small class="error-text" v-if="errors.password">{{ errors.password }}</small>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="rememberMe" />
              <span>Recordar sesión</span>
            </label>
            <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            <i class="pi pi-arrow-right"></i>
          </button>

          <div v-if="errorMessage" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            {{ errorMessage }}
          </div>
        </form>

        <div class="card-footer">
          <p>¿No tienes cuenta? <router-link to="/register">Regístrate aquí</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  username: '',
  password: '',
});

const loading = ref(false);
const errorMessage = ref('');
const registerSuccess = ref(false);
const registeredUsername = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const usernameValidation = ref('');
const passwordValidation = ref('');

const errors = reactive({
  username: '',
  password: '',
});

const usernameValidationClass = computed(() => {
  if (usernameValidation.value === 'valid') return 'valid';
  if (usernameValidation.value === 'error') return 'error';
  return '';
});

const passwordValidationClass = computed(() => {
  if (passwordValidation.value === 'valid') return 'valid';
  if (passwordValidation.value === 'error') return 'error';
  return '';
});

function validateUsername() {
  if (form.username && form.username.length >= 3) {
    usernameValidation.value = 'valid';
  } else if (form.username && form.username.length < 3) {
    usernameValidation.value = 'error';
  }
}

function validatePassword() {
  if (form.password && form.password.length >= 8) {
    passwordValidation.value = 'valid';
  } else if (form.password && form.password.length < 8) {
    passwordValidation.value = 'error';
  }
}

onMounted(() => {
  console.log('✅ Login component mounted');
  
  if (route.query.registered === 'true' && route.query.username) {
    registerSuccess.value = true;
    registeredUsername.value = route.query.username;
    form.username = route.query.username;
    
    setTimeout(() => {
      registerSuccess.value = false;
    }, 8000);
  }
});

async function handleLogin() {
  errors.username = '';
  errors.password = '';
  errorMessage.value = '';

  if (!form.username) {
    errors.username = 'El usuario es requerido';
    usernameValidation.value = 'error';
    return;
  }
  if (!form.password) {
    errors.password = 'La contraseña es requerida';
    passwordValidation.value = 'error';
    return;
  }

  loading.value = true;

  try {
    const result = await authStore.login({
      username: form.username,
      password: form.password,
    });

    if (result.success) {
      router.push('/');
    } else {
      errorMessage.value = result.error || 'Error al iniciar sesión';
    }
  } catch (error) {
    console.error('Error en login:', error);
    errorMessage.value = 'Ocurrió un error inesperado.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
   background: #f4f0f7;
  padding: 2rem;
}

.login-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1100px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 28px;
  overflow: hidden;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
}

.login-hero {
  padding: 3rem 2.5rem;
  display: flex;
  align-items: center;
  background: rgba(126, 9, 126, 0.3);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
}

.hero-content {
  color: white;
}

.hero-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.3rem 1rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-content h1 {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  line-height: 1.2;
}

.hero-content p {
  font-size: 1rem;
  opacity: 0.85;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.hero-features {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feature-tag {
  font-size: 0.85rem;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-card {
  padding: 3rem;
  background: white;
  border-radius: 0;
}

.card-header {
  margin-bottom: 2rem;
}

.header-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-primary-2);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary-3);
  display: inline-block;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 0.25rem;
}

.card-header p {
  color: #6b7280;
  font-size: 0.9rem;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.message-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;
}

.success-message strong {
  color: #1a1a2e;
}

.success-message p {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0.15rem 0 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.validation-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.1rem 0.5rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.validation-badge.valid {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.validation-badge.error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.8rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-3);
  box-shadow: 0 0 0 4px rgba(188, 74, 185, 0.1);
  background: white;
}

.form-input.input-error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.password-toggle {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
}

.password-toggle:hover {
  color: #374151;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0.25rem 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6b7280;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary-3);
  cursor: pointer;
}

.forgot-link {
  font-size: 0.85rem;
  color: var(--color-primary-2);
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.btn-primary {
  padding: 0.85rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(126, 9, 126, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.card-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
  color: #6b7280;
}

.card-footer a {
  color: var(--color-primary-2);
  text-decoration: none;
  font-weight: 600;
}

.card-footer a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 900px) {
  .login-wrapper {
    grid-template-columns: 1fr;
  }
  
  .login-hero {
    padding: 2rem;
  }
  
  .hero-content h1 {
    font-size: 2.2rem;
  }
  
  .login-card {
    padding: 2rem;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-card {
    padding: 1.5rem;
  }
  
  .form-options {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>