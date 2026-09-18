<template>
  <div class="register-container">
    <div class="register-wrapper">
      <div class="register-hero">
        <div class="hero-content">
          <div class="hero-badge">✦ PROFESSIONAL</div>
          <h1>Únete a Sabix</h1>
          <p>Registra tu restaurante y comienza a gestionar tus pedidos de forma profesional.</p>
          <div class="hero-features">
            <span class="feature-tag">✓ Gestión de pedidos</span>
            <span class="feature-tag">✓ Menú digital</span>
            <span class="feature-tag">✓ Reportes en tiempo real</span>
          </div>
          <div class="hero-steps">
            <div class="step-indicator">
              <span class="step-dot" :class="{ active: currentStep >= 1 }">1</span>
              <span class="step-line" :class="{ active: currentStep >= 2 }"></span>
              <span class="step-dot" :class="{ active: currentStep >= 2 }">2</span>
              <span class="step-line" :class="{ active: currentStep >= 3 }"></span>
              <span class="step-dot" :class="{ active: currentStep >= 3 }">3</span>
            </div>
            <div class="step-labels">
              <span :class="{ active: currentStep === 1 }">Cuenta</span>
              <span :class="{ active: currentStep === 2 }">Restaurante</span>
              <span :class="{ active: currentStep === 3 }">Confirmar</span>
            </div>
          </div>
        </div>
      </div>

      <div class="register-card glass">
        <div class="card-header">
          <div class="header-badge">
            <span class="badge-dot"></span>
            {{ currentStep === 1 ? 'PASO 1 DE 3' : currentStep === 2 ? 'PASO 2 DE 3' : 'PASO 3 DE 3' }}
          </div>
          <h2>{{ stepTitle }}</h2>
          <p>{{ stepDescription }}</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <!-- Paso 1: Datos de la cuenta -->
          <div v-if="currentStep === 1" class="step-content">
            <div class="form-group">
              <label for="username">
                <span>Usuario</span>
                <span class="validation-badge" :class="usernameValidationClass">
                  {{ usernameValidation === 'valid' ? '✓ Disponible' : usernameValidation === 'error' ? '✗ No disponible' : '' }}
                </span>
              </label>
              <div class="input-wrapper">
                <i class="pi pi-user input-icon"></i>
                <InputText
                  id="username"
                  v-model="form.username"
                  type="text"
                  placeholder="Ej: mi_restaurante"
                  :invalid="!!errors.username"
                  @blur="checkUsername"
                  class="w-full form-input"
                />
              </div>
              <small v-if="usernameAvailable === true" class="success-text">
                <i class="pi pi-check-circle"></i> Usuario disponible
              </small>
              <small class="error-text" v-if="errors.username">{{ errors.username }}</small>
            </div>

            <div class="form-group">
              <label for="email">
                <span>Email</span>
                <span class="validation-badge" :class="emailValidationClass">
                  {{ emailValidation === 'valid' ? '✓ Válido' : emailValidation === 'error' ? '✗ En uso' : '' }}
                </span>
              </label>
              <div class="input-wrapper">
                <i class="pi pi-envelope input-icon"></i>
                <InputText
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="Ej: restaurante@email.com"
                  :invalid="!!errors.email"
                  @blur="checkEmail"
                  class="w-full form-input"
                />
              </div>
              <small v-if="emailAvailable === true" class="success-text">
                <i class="pi pi-check-circle"></i> Email disponible
              </small>
              <small class="error-text" v-if="errors.email">{{ errors.email }}</small>
            </div>

            <div class="form-group">
              <label for="password">
                <span>Contraseña</span>
                <span class="validation-badge" :class="passwordValidationClass">
                  {{ passwordValidation === 'valid' ? '✓ Segura' : passwordValidation === 'error' ? '✗ Débil' : '' }}
                </span>
              </label>
              <div class="input-wrapper">
                <i class="pi pi-lock input-icon"></i>
                <Password
                  id="password"
                  v-model="form.password"
                  placeholder="Mínimo 8 caracteres"
                  :feedback="true"
                  toggleMask
                  :invalid="!!errors.password"
                  class="w-full form-input"
                />
              </div>
              <small class="error-text" v-if="errors.password">{{ errors.password }}</small>
            </div>

            <div class="form-group">
              <label for="password2">Confirmar Contraseña</label>
              <div class="input-wrapper">
                <i class="pi pi-lock input-icon"></i>
                <Password
                  id="password2"
                  v-model="form.password2"
                  placeholder="Repite tu contraseña"
                  :feedback="false"
                  toggleMask
                  :invalid="!!errors.password2"
                  class="w-full form-input"
                />
              </div>
              <small class="error-text" v-if="errors.password2">{{ errors.password2 }}</small>
            </div>
          </div>

          <!-- Paso 2: Datos del restaurante -->
          <div v-if="currentStep === 2" class="step-content">
            <div class="form-group">
              <label for="restaurant_name">Nombre del Restaurante *</label>
              <div class="input-wrapper">
                <i class="pi pi-store input-icon"></i>
                <InputText
                  id="restaurant_name"
                  v-model="form.restaurant_name"
                  type="text"
                  placeholder="Ej: La Cocina de María"
                  :invalid="!!errors.restaurant_name"
                  class="w-full form-input"
                />
              </div>
              <small class="error-text" v-if="errors.restaurant_name">{{ errors.restaurant_name }}</small>
            </div>

            <div class="form-group">
              <label for="restaurant_description">Descripción</label>
              <div class="input-wrapper textarea-wrapper">
                <Textarea
                  id="restaurant_description"
                  v-model="form.restaurant_description"
                  placeholder="Describe tu restaurante, especialidades, horarios, etc."
                  rows="3"
                  :invalid="!!errors.restaurant_description"
                  class="w-full form-input"
                />
              </div>
              <small class="error-text" v-if="errors.restaurant_description">{{ errors.restaurant_description }}</small>
            </div>

            <div class="form-group">
              <label for="restaurant_address">Dirección del Restaurante *</label>
              <div class="input-wrapper textarea-wrapper">
                <Textarea
                  id="restaurant_address"
                  v-model="form.restaurant_address"
                  placeholder="Calle, número, colonia, ciudad"
                  rows="2"
                  :invalid="!!errors.restaurant_address"
                  class="w-full form-input"
                />
              </div>
              <small class="error-text" v-if="errors.restaurant_address">{{ errors.restaurant_address }}</small>
            </div>

            <div class="form-group">
              <label for="phone">Teléfono del Restaurante *</label>
              <div class="input-wrapper">
                <i class="pi pi-phone input-icon"></i>
                <InputText
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  placeholder="Ej: 5551234567"
                  :invalid="!!errors.phone"
                  class="w-full form-input"
                />
              </div>
              <small class="error-text" v-if="errors.phone">{{ errors.phone }}</small>
            </div>

            <div class="form-row">
              <div class="form-group half">
                <label for="first_name">Nombre del Contacto *</label>
                <div class="input-wrapper">
                  <i class="pi pi-user input-icon"></i>
                  <InputText
                    id="first_name"
                    v-model="form.first_name"
                    type="text"
                    placeholder="Nombre"
                    :invalid="!!errors.first_name"
                    class="w-full form-input"
                  />
                </div>
                <small class="error-text" v-if="errors.first_name">{{ errors.first_name }}</small>
              </div>

              <div class="form-group half">
                <label for="last_name">Apellido</label>
                <div class="input-wrapper">
                  <i class="pi pi-user input-icon"></i>
                  <InputText
                    id="last_name"
                    v-model="form.last_name"
                    type="text"
                    placeholder="Apellido"
                    :invalid="!!errors.last_name"
                    class="w-full form-input"
                  />
                </div>
                <small class="error-text" v-if="errors.last_name">{{ errors.last_name }}</small>
              </div>
            </div>
          </div>

          <!-- Paso 3: Confirmación -->
          <div v-if="currentStep === 3" class="step-content">
            <p class="confirmation-text">
              Revisa que todos los datos sean correctos antes de finalizar el registro.
            </p>
            
            <div class="confirmation-card">
              <div class="confirmation-item">
                <span class="label">Usuario</span>
                <span class="value">{{ form.username }}</span>
              </div>
              <div class="confirmation-item">
                <span class="label">Email</span>
                <span class="value">{{ form.email }}</span>
              </div>
              <div class="confirmation-item">
                <span class="label">Restaurante</span>
                <span class="value">{{ form.restaurant_name }}</span>
              </div>
              <div class="confirmation-item">
                <span class="label">Dirección</span>
                <span class="value">{{ form.restaurant_address }}</span>
              </div>
              <div class="confirmation-item">
                <span class="label">Teléfono</span>
                <span class="value">{{ form.phone }}</span>
              </div>
              <div class="confirmation-item">
                <span class="label">Contacto</span>
                <span class="value">{{ form.first_name }} {{ form.last_name }}</span>
              </div>
            </div>

            <div class="terms-check">
              <label class="checkbox-label">
                <input type="checkbox" v-model="acceptTerms" />
                <span>Acepto los <a href="#" @click.prevent="showTerms">Términos y Condiciones</a></span>
              </label>
            </div>
          </div>

          <!-- Navegación entre pasos -->
          <div class="step-navigation">
            <button
              v-if="currentStep > 1"
              type="button"
              class="btn-secondary"
              @click="prevStep"
            >
              <i class="pi pi-chevron-left"></i> Anterior
            </button>
            
            <button
              v-if="currentStep < 3"
              type="button"
              class="btn-primary"
              @click="nextStep"
            >
              Siguiente <i class="pi pi-chevron-right"></i>
            </button>
            
            <button
              v-if="currentStep === 3"
              type="submit"
              class="btn-primary"
              :disabled="loading || !acceptTerms"
            >
              {{ loading ? 'Registrando...' : 'Crear cuenta' }}
              <i class="pi pi-arrow-right"></i>
            </button>
          </div>

          <div v-if="errorMessage" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            {{ errorMessage }}
          </div>
        </form>

        <div class="card-footer">
          <p>¿Ya tienes cuenta? <router-link to="/login">Inicia Sesión</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Textarea from 'primevue/textarea';
import api from '@/services/api';

const router = useRouter();

const form = reactive({
  username: '',
  email: '',
  password: '',
  password2: '',
  first_name: '',
  last_name: '',
  phone: '',
  restaurant_name: '',
  restaurant_description: '',
  restaurant_address: '',
  user_type: 'restaurant',
});

const errors = reactive({});
const loading = ref(false);
const errorMessage = ref('');
const currentStep = ref(1);
const acceptTerms = ref(false);
const usernameAvailable = ref(null);
const emailAvailable = ref(null);
const usernameValidation = ref('');
const emailValidation = ref('');
const passwordValidation = ref('');

const stepTitle = computed(() => {
  const titles = ['Datos de la cuenta', 'Datos del restaurante', 'Confirmación'];
  return titles[currentStep.value - 1] || '';
});

const stepDescription = computed(() => {
  const descriptions = [
    'Crea tu usuario y contraseña para acceder al panel',
    'Ingresa la información de tu restaurante',
    'Verifica que toda la información sea correcta'
  ];
  return descriptions[currentStep.value - 1] || '';
});

const usernameValidationClass = computed(() => {
  if (usernameValidation.value === 'valid') return 'valid';
  if (usernameValidation.value === 'error') return 'error';
  return '';
});

const emailValidationClass = computed(() => {
  if (emailValidation.value === 'valid') return 'valid';
  if (emailValidation.value === 'error') return 'error';
  return '';
});

const passwordValidationClass = computed(() => {
  if (passwordValidation.value === 'valid') return 'valid';
  if (passwordValidation.value === 'error') return 'error';
  return '';
});

async function checkUsername() {
  if (!form.username || form.username.length < 3) {
    usernameAvailable.value = null;
    usernameValidation.value = '';
    return;
  }
  
  try {
    const response = await api.get('/users/check-username/', {
      params: { username: form.username }
    });
    usernameAvailable.value = response.data.available;
    if (!response.data.available) {
      errors.username = 'Este usuario ya está registrado';
      usernameValidation.value = 'error';
    } else {
      delete errors.username;
      usernameValidation.value = 'valid';
    }
  } catch (error) {
    console.error('Error verificando username:', error);
    usernameAvailable.value = null;
    usernameValidation.value = '';
  }
}

async function checkEmail() {
  if (!form.email || !form.email.includes('@')) {
    emailAvailable.value = null;
    emailValidation.value = '';
    return;
  }
  
  try {
    const response = await api.get('/users/check-email/', {
      params: { email: form.email }
    });
    emailAvailable.value = response.data.available;
    if (!response.data.available) {
      errors.email = 'Este email ya está registrado';
      emailValidation.value = 'error';
    } else {
      delete errors.email;
      emailValidation.value = 'valid';
    }
  } catch (error) {
    console.error('Error verificando email:', error);
    emailAvailable.value = null;
    emailValidation.value = '';
  }
}

function validateStep(step) {
  const stepErrors = {};
  let isValid = true;

  if (step === 1) {
    if (!form.username || form.username.length < 3) {
      stepErrors.username = 'El usuario debe tener al menos 3 caracteres';
      usernameValidation.value = 'error';
      isValid = false;
    } else if (usernameAvailable.value === false) {
      stepErrors.username = 'Este usuario ya está registrado';
      usernameValidation.value = 'error';
      isValid = false;
    } else {
      usernameValidation.value = 'valid';
    }
    
    if (!form.email || !form.email.includes('@')) {
      stepErrors.email = 'Ingresa un email válido';
      emailValidation.value = 'error';
      isValid = false;
    } else if (emailAvailable.value === false) {
      stepErrors.email = 'Este email ya está registrado';
      emailValidation.value = 'error';
      isValid = false;
    } else {
      emailValidation.value = 'valid';
    }
    
    if (!form.password || form.password.length < 8) {
      stepErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      passwordValidation.value = 'error';
      isValid = false;
    } else {
      passwordValidation.value = 'valid';
    }
    
    if (form.password !== form.password2) {
      stepErrors.password2 = 'Las contraseñas no coinciden';
      isValid = false;
    }
  }

  if (step === 2) {
    if (!form.restaurant_name || form.restaurant_name.length < 3) {
      stepErrors.restaurant_name = 'El nombre del restaurante es requerido (mínimo 3 caracteres)';
      isValid = false;
    }
    
    if (!form.restaurant_address || form.restaurant_address.length < 5) {
      stepErrors.restaurant_address = 'La dirección completa es requerida';
      isValid = false;
    }
    
    if (!form.phone || form.phone.length < 8) {
      stepErrors.phone = 'El teléfono es requerido (mínimo 8 dígitos)';
      isValid = false;
    }
    
    if (!form.first_name || form.first_name.length < 2) {
      stepErrors.first_name = 'El nombre del contacto es requerido';
      isValid = false;
    }
  }

  Object.assign(errors, stepErrors);
  return isValid;
}

function nextStep() {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < 3) {
      currentStep.value++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

async function handleRegister() {
  if (!acceptTerms.value) {
    errorMessage.value = 'Debes aceptar los términos y condiciones';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  
  Object.keys(errors).forEach(key => delete errors[key]);

  try {
    const registerData = {
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      password2: form.password2,
      first_name: form.first_name.trim(),
      last_name: form.last_name?.trim() || '',
      phone: form.phone.trim(),
      user_type: 'restaurant',
      restaurant_name: form.restaurant_name.trim(),
      restaurant_description: form.restaurant_description?.trim() || '',
      restaurant_address: form.restaurant_address.trim(),
    };

    console.log('📤 Enviando datos de registro:', registerData);

    const response = await api.post('/users/register/', registerData);

    console.log('✅ Registro exitoso:', response.data);

    if (response.data) {
      if (response.data.access && response.data.refresh) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        router.push('/');
      } else {
        router.push({
          path: '/login',
          query: { registered: 'true', username: form.username }
        });
      }
    }
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    if (error.response?.data) {
      const errorData = error.response.data;
      
      if (typeof errorData === 'object') {
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            errors[field] = errorData[field][0];
          } else if (typeof errorData[field] === 'string') {
            errors[field] = errorData[field];
          }
        });
        
        if (errorData.non_field_errors) {
          errorMessage.value = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage.value = errorData.detail;
        } else if (errorData.error) {
          errorMessage.value = errorData.error;
        } else {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const firstError = errorData[firstKey];
            if (Array.isArray(firstError)) {
              errorMessage.value = `${firstKey}: ${firstError[0]}`;
            } else if (typeof firstError === 'string') {
              errorMessage.value = `${firstKey}: ${firstError}`;
            }
          }
        }
      } else if (typeof errorData === 'string') {
        errorMessage.value = errorData;
      }
    } else if (error.message) {
      errorMessage.value = error.message;
    } else {
      errorMessage.value = 'Error al registrar. Intenta nuevamente.';
    }
    
    if (Object.keys(errors).length > 0) {
      const step1Fields = ['username', 'email', 'password', 'password2'];
      const step2Fields = ['restaurant_name', 'restaurant_address', 'phone', 'first_name', 'last_name'];
      
      const hasStep1Error = Object.keys(errors).some(key => step1Fields.includes(key));
      const hasStep2Error = Object.keys(errors).some(key => step2Fields.includes(key));
      
      if (hasStep1Error) {
        currentStep.value = 1;
      } else if (hasStep2Error) {
        currentStep.value = 2;
      }
    }
  } finally {
    loading.value = false;
  }
}

function showTerms() {
  alert('📋 Términos y condiciones del servicio Sabix Delivery...\n\n' +
        '1. El restaurante se compromete a cumplir con los horarios establecidos.\n' +
        '2. Los precios deben estar actualizados.\n' +
        '3. La calidad de los productos es responsabilidad del restaurante.\n' +
        '4. Sabix Delivery se reserva el derecho de verificar la información.');
}

onMounted(() => {
  console.log('✅ Register component mounted');
});
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f0f7;
  padding: 2rem;
}

.register-wrapper {
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

.register-hero {
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
  margin-bottom: 2rem;
}

.feature-tag {
  font-size: 0.85rem;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hero-steps {
  margin-top: 1rem;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
}

.step-dot.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: white;
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.step-line.active {
  background: rgba(255, 255, 255, 0.5);
}

.step-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.step-labels span.active {
  color: white;
  font-weight: 600;
}

.register-card {
  padding: 3rem;
  background: white;
  border-radius: 0;
  max-height: 90vh;
  overflow-y: auto;
}

.register-card::-webkit-scrollbar {
  width: 4px;
}

.register-card::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.register-card::-webkit-scrollbar-thumb {
  background: var(--color-primary-3);
  border-radius: 2px;
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group.half {
  margin-bottom: 0;
}

.input-wrapper {
  position: relative;
}

.input-wrapper.textarea-wrapper {
  display: flex;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1rem;
}

.textarea-wrapper .input-icon {
  display: none;
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

.textarea-wrapper .form-input {
  padding: 0.75rem 1rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-3);
  box-shadow: 0 0 0 4px rgba(188, 74, 185, 0.1);
  background: white;
}

.form-input.p-invalid {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.form-input :deep(.p-password input) {
  padding: 0.75rem 1rem 0.75rem 2.8rem;
  border: none;
  background: transparent;
  font-size: 0.95rem;
}

.form-input :deep(.p-password) {
  width: 100%;
}

.form-input :deep(.p-password .p-password-icon) {
  right: 1rem;
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

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
}

.success-text {
  color: #22c55e;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.step-navigation {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.step-navigation button {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
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

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
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

.confirmation-text {
  color: #6b7280;
  margin-bottom: 1rem;
}

.confirmation-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.confirmation-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.confirmation-item:last-child {
  border-bottom: none;
}

.confirmation-item .label {
  color: #6b7280;
  font-size: 0.85rem;
}

.confirmation-item .value {
  font-weight: 500;
  color: #1a1a2e;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.terms-check {
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #374151;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary-3);
  cursor: pointer;
}

.checkbox-label a {
  color: var(--color-primary-2);
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
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
  .register-wrapper {
    grid-template-columns: 1fr;
  }
  
  .register-hero {
    padding: 2rem;
  }
  
  .hero-content h1 {
    font-size: 2.2rem;
  }
  
  .register-card {
    padding: 2rem;
  }
}

@media (max-width: 640px) {
  .register-container {
    padding: 1rem;
  }
  
  .register-card {
    padding: 1.5rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .step-navigation {
    flex-direction: column;
  }
  
  .step-indicator {
    gap: 0.25rem;
  }
  
  .step-dot {
    width: 28px;
    height: 28px;
    font-size: 0.7rem;
  }
}
</style>