<template>
  <section class="profile-page">
    <header class="page-heading">
      <div>
        <p class="eyebrow">CUENTA DEL RESTAURANTE</p>
        <h1>Perfil del restaurante</h1>
        <p class="page-description">Mantén actualizados los datos que ven tus clientes.</p>
      </div>
      <span class="verification-badge" :class="{ verified: authStore.restaurant?.is_verified }">
        <i :class="authStore.restaurant?.is_verified ? 'pi pi-verified' : 'pi pi-clock'"></i>
        {{ authStore.restaurant?.is_verified ? 'Restaurante verificado' : 'Verificación pendiente' }}
      </span>
    </header>

    <div class="profile-grid">
      <form class="profile-card restaurant-card" @submit.prevent="saveProfile">
        <div class="card-heading">
          <div class="card-icon"><i class="pi pi-shop"></i></div>
          <div>
            <h2>Información del restaurante</h2>
            <p>Estos datos forman parte de tu perfil público.</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="field full-width" for="restaurant-name">
            <span>Nombre del restaurante</span>
            <input id="restaurant-name" v-model.trim="profile.restaurant_name" type="text" maxlength="120" required />
          </label>

          <label class="field full-width" for="restaurant-description">
            <span>Descripción</span>
            <textarea
              id="restaurant-description"
              v-model.trim="profile.restaurant_description"
              rows="4"
              maxlength="500"
              placeholder="Cuéntales a tus clientes qué hace especial a tu restaurante."
            ></textarea>
            <small>{{ profile.restaurant_description.length }}/500 caracteres</small>
          </label>

          <label class="field full-width" for="restaurant-address">
            <span>Dirección</span>
            <textarea id="restaurant-address" v-model.trim="profile.restaurant_address" rows="2" required></textarea>
          </label>

          <label class="field" for="restaurant-phone">
            <span>Teléfono de contacto</span>
            <input id="restaurant-phone" v-model.trim="profile.phone" type="tel" autocomplete="tel" />
          </label>

          <label class="field" for="restaurant-latitude">
            <span>Latitud</span>
            <input
              id="restaurant-latitude"
              v-model.trim="profile.latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
            />
          </label>

          <label class="field" for="restaurant-longitude">
            <span>Longitud</span>
            <input
              id="restaurant-longitude"
              v-model.trim="profile.longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
            />
          </label>

          <button class="secondary-button location-button" type="button" @click="useCurrentLocation">
            <i class="pi pi-map-marker"></i>
            Usar ubicación actual
          </button>
        </div>

        <div v-if="profileSuccess" class="form-alert success-alert" role="status">
          <i class="pi pi-check-circle"></i>
          <span>{{ profileSuccess }}</span>
        </div>
        <div v-if="profileError" class="form-alert error-alert" role="alert">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ profileError }}</span>
        </div>

        <div class="card-actions">
          <button class="primary-button" type="submit" :disabled="savingProfile || loadingProfile">
            <i :class="savingProfile ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
            {{ savingProfile ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </form>

      <form class="profile-card password-card" @submit.prevent="savePassword">
        <div class="card-heading">
          <div class="card-icon security-icon"><i class="pi pi-lock"></i></div>
          <div>
            <h2>Seguridad</h2>
            <p>Cambia la contraseña de acceso a tu cuenta.</p>
          </div>
        </div>

        <div class="password-fields">
          <label class="field" for="current-password">
            <span>Contraseña actual</span>
            <input id="current-password" v-model="password.currentPassword" type="password" autocomplete="current-password" required />
          </label>
          <label class="field" for="new-password">
            <span>Nueva contraseña</span>
            <input
              id="new-password"
              v-model="password.newPassword"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
            />
            <small>Debe tener al menos 8 caracteres.</small>
          </label>
          <label class="field" for="confirm-password">
            <span>Confirmar nueva contraseña</span>
            <input
              id="confirm-password"
              v-model="password.confirmPassword"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
            />
          </label>
        </div>

        <div v-if="passwordError" class="form-alert error-alert" role="alert">
          <i class="pi pi-exclamation-circle"></i>
          <span>{{ passwordError }}</span>
        </div>
        <div v-if="passwordSuccess" class="form-alert success-alert" role="status">
          <i class="pi pi-check-circle"></i>
          <span>{{ passwordSuccess }}</span>
        </div>

        <div class="card-actions">
          <button class="secondary-button" type="submit" :disabled="savingPassword">
            <i :class="savingPassword ? 'pi pi-spin pi-spinner' : 'pi pi-key'"></i>
            {{ savingPassword ? 'Actualizando...' : 'Actualizar contraseña' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const authStore = useAuthStore();

const profile = reactive({
  restaurant_name: '',
  restaurant_description: '',
  restaurant_address: '',
  phone: '',
  latitude: '',
  longitude: '',
});
const password = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const loadingProfile = ref(false);
const savingProfile = ref(false);
const savingPassword = ref(false);
const profileError = ref('');
const profileSuccess = ref('');
const passwordError = ref('');
const passwordSuccess = ref('');

function populateProfile(userData) {
  const restaurant = userData.restaurant || userData;
  profile.restaurant_name = restaurant.restaurant_name || restaurant.name || '';
  profile.restaurant_description = restaurant.restaurant_description || restaurant.description || '';
  profile.restaurant_address = restaurant.restaurant_address || restaurant.address || '';
  profile.phone = restaurant.restaurant_phone || restaurant.phone || '';
  profile.latitude = restaurant.current_location_lat ?? restaurant.latitude ?? restaurant.latitud ?? '';
  profile.longitude = restaurant.current_location_lng ?? restaurant.longitude ?? restaurant.longitud ?? '';
}

function useCurrentLocation() {
  profileError.value = '';
  profileSuccess.value = '';

  if (!navigator.geolocation) {
    profileError.value = 'Este dispositivo no permite obtener la ubicación.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      profile.latitude = position.coords.latitude.toFixed(7);
      profile.longitude = position.coords.longitude.toFixed(7);
      profileSuccess.value = 'Ubicación obtenida. Guarda los cambios para enviarla al servidor.';
    },
    (error) => {
      profileError.value = error.code === 1
        ? 'Debes permitir el acceso a la ubicación.'
        : 'No se pudo obtener la ubicación actual.';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
  );
}

function getErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data && typeof data === 'object') {
    const firstFieldError = Object.values(data).flat().find(value => typeof value === 'string');
    if (firstFieldError) return firstFieldError;
  }
  return fallback;
}

async function loadProfile() {
  loadingProfile.value = true;
  profileError.value = '';
  try {
    const response = await api.get('/users/profile/');
    const userData = response.data?.user || response.data?.profile || response.data;
    populateProfile(userData);
  } catch (error) {
    console.error('Error al cargar perfil del restaurante:', error);
    profileError.value = getErrorMessage(error, 'No se pudo cargar el perfil del restaurante.');
    populateProfile(authStore.user || {});
  } finally {
    loadingProfile.value = false;
  }
}

async function saveProfile() {
  savingProfile.value = true;
  profileError.value = '';
  profileSuccess.value = '';
  try {
    await authStore.updateRestaurantProfile({
      restaurant_name: profile.restaurant_name,
      restaurant_description: profile.restaurant_description,
      restaurant_address: profile.restaurant_address,
      phone: profile.phone,
      current_location_lat: profile.latitude === '' ? null : Number(profile.latitude),
      current_location_lng: profile.longitude === '' ? null : Number(profile.longitude),
    });
    profileSuccess.value = 'Los datos del restaurante se guardaron correctamente.';
  } catch (error) {
    console.error('Error al guardar perfil del restaurante:', error);
    profileError.value = getErrorMessage(error, 'No se pudieron guardar los cambios.');
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  passwordError.value = '';
  passwordSuccess.value = '';

  if (password.newPassword.length < 8) {
    passwordError.value = 'La nueva contraseña debe tener al menos 8 caracteres.';
    return;
  }
  if (password.newPassword !== password.confirmPassword) {
    passwordError.value = 'Las contraseñas nuevas no coinciden.';
    return;
  }

  savingPassword.value = true;
  try {
    await authStore.changePassword(password);
    password.currentPassword = '';
    password.newPassword = '';
    password.confirmPassword = '';
    passwordSuccess.value = 'La contraseña se actualizó correctamente.';
  } catch (error) {
    console.error('Error al actualizar contraseña:', error);
    passwordError.value = getErrorMessage(error, 'No se pudo actualizar la contraseña.');
  } finally {
    savingPassword.value = false;
  }
}

onMounted(() => {
  populateProfile(authStore.user || {});
  loadProfile();
});
</script>

<style scoped>
.profile-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.eyebrow {
  margin: 0 0 0.45rem;
  color: var(--color-primary-3, #bc4ab9);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.page-heading h1 {
  margin: 0;
  color: #1a1a2e;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 700;
}

.page-description {
  margin: 0.45rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.verification-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  flex: 0 0 auto;
  padding: 0.55rem 0.8rem;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.verification-badge.verified {
  color: #166534;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  align-items: start;
  gap: 1.25rem;
}

.profile-card {
  min-width: 0;
  padding: clamp(1.1rem, 2vw, 1.5rem);
  background: #fff;
  border: 1px solid #ececf1;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgb(26 26 46 / 5%);
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid #f0f0f3;
  margin-bottom: 1.25rem;
}

.card-icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  color: #8b2689;
  background: #f8eafb;
  border-radius: 10px;
  font-size: 1.1rem;
}

.security-icon {
  color: #1d4ed8;
  background: #eff6ff;
}

.card-heading h2 {
  margin: 0;
  color: #25243a;
  font-size: 1rem;
  font-weight: 700;
}

.card-heading p {
  margin: 0.3rem 0 0;
  color: #777987;
  font-size: 0.82rem;
  line-height: 1.4;
}

.form-grid,
.password-fields {
  display: grid;
  gap: 1rem;
}

.form-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.password-fields {
  grid-template-columns: 1fr;
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.45rem;
  color: #414154;
  font-size: 0.83rem;
  font-weight: 600;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field input,
.field textarea {
  width: 100%;
  padding: 0.75rem 0.85rem;
  color: #25243a;
  background: #fff;
  border: 1px solid #dfe0e7;
  border-radius: 8px;
  font: inherit;
  font-weight: 400;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.field textarea {
  min-height: 5rem;
  resize: vertical;
  line-height: 1.5;
}

.field input:focus,
.field textarea:focus {
  border-color: var(--color-primary-3, #bc4ab9);
  box-shadow: 0 0 0 3px rgb(188 74 185 / 12%);
}

.field small {
  color: #8b8c98;
  font-size: 0.75rem;
  font-weight: 400;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 1.25rem;
  margin-top: 1.25rem;
  border-top: 1px solid #f0f0f3;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  min-height: 2.65rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  color: #fff;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.primary-button {
  background: linear-gradient(135deg, var(--color-primary-2, #7e097e), var(--color-primary-4, #9d2a9c));
}

.secondary-button {
  background: #29364f;
}

.primary-button:hover:not(:disabled),
.secondary-button:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.location-button {
  align-self: end;
  min-height: 44px;
  width: 100%;
  margin-bottom: 2px;
}

.form-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.75rem 0.85rem;
  margin-top: 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  line-height: 1.45;
}

.error-alert {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.success-alert {
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

@media (max-width: 800px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 540px) {
  .page-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.9rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .field.full-width {
    grid-column: auto;
  }

  .card-actions,
  .card-actions button {
    width: 100%;
  }
}
</style>