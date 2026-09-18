<template>
  <div class="category-form">
    <div class="page-header">
      <div>
        <h1>{{ isEditing ? 'Editar Categoría' : 'Nueva Categoría' }}</h1>
        <p class="subtitle">
          {{ isEditing ? 'Actualiza la información de la categoría' : 'Crea una nueva categoría para tu menú' }}
        </p>
      </div>
      <button class="btn-secondary" @click="goBack">
        <i class="pi pi-times"></i> Cancelar
      </button>
    </div>

    <div class="form-card">
      <form @submit.prevent="submitForm">
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="name">Nombre de la Categoría *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Ej: Pizzas, Bebidas, Postres"
              :class="['form-input', { 'is-invalid': errors.name }]"
            />
            <small class="error-text" v-if="errors.name">{{ errors.name }}</small>
          </div>

          <div class="form-group">
            <label for="icon">Ícono (Emoji)</label>
            <input
              id="icon"
              v-model="form.icon"
              type="text"
              placeholder="Ej: 🍕, 🥤, 🎂"
              :class="['form-input', { 'is-invalid': errors.icon }]"
              maxlength="2"
            />
            <small class="help-text">Usa un emoji para representar la categoría</small>
            <small class="error-text" v-if="errors.icon">{{ errors.icon }}</small>
          </div>

          <div class="form-group">
            <label>Orden de Visualización</label>
            <input
              v-model.number="form.order"
              type="number"
              min="0"
              placeholder="0"
              class="form-input"
            />
            <small class="help-text">Número menor = aparece primero</small>
          </div>

          <div class="form-group full-width">
            <label for="description">Descripción</label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="Describe brevemente esta categoría"
              rows="3"
              :class="['form-input', { 'is-invalid': errors.description }]"
            ></textarea>
            <small class="error-text" v-if="errors.description">{{ errors.description }}</small>
          </div>

          <div class="form-group full-width">
            <label>Categoría Activa</label>
            <div class="toggle-wrapper">
              <span class="toggle-label">{{ form.is_active ? 'Activa' : 'Inactiva' }}</span>
              <label class="toggle-switch">
                <input type="checkbox" v-model="form.is_active" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <small class="help-text">Las categorías inactivas no se muestran a los clientes</small>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="goBack">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            <i class="pi pi-save"></i>
            {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Categoría') }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCategoriesStore } from '@/stores/categories';

const router = useRouter();
const route = useRoute();
const categoriesStore = useCategoriesStore();

// Estado
const loading = ref(false);
const error = ref('');
const errors = reactive({});
const form = reactive({
  name: '',
  icon: '',
  description: '',
  order: 0,
  is_active: true,
});

const isEditing = computed(() => !!route.params.id);

// Cargar datos si es edición
onMounted(async () => {
  if (isEditing.value) {
    try {
      loading.value = true;
      const category = await categoriesStore.fetchCategory(route.params.id);
      if (category) {
        form.name = category.name || '';
        form.icon = category.icon || '';
        form.description = category.description || '';
        form.order = category.order || 0;
        form.is_active = category.is_active !== undefined ? category.is_active : true;
      }
    } catch (err) {
      console.error('Error loading category:', err);
      error.value = 'No se pudo cargar la categoría';
    } finally {
      loading.value = false;
    }
  }
});

// Validar formulario
function validateForm() {
  Object.keys(errors).forEach(key => delete errors[key]);
  let isValid = true;

  if (!form.name || form.name.trim().length < 2) {
    errors.name = 'El nombre de la categoría es requerido (mínimo 2 caracteres)';
    isValid = false;
  }

  // Validación básica de emoji
  if (form.icon && form.icon.length > 2) {
    errors.icon = 'El ícono debe ser un emoji (máximo 2 caracteres)';
    isValid = false;
  }

  return isValid;
}

// Enviar formulario
async function submitForm() {
  if (!validateForm()) return;

  loading.value = true;
  error.value = '';

  try {
    const data = {
      name: form.name.trim(),
      icon: form.icon || '',
      description: form.description?.trim() || '',
      order: form.order || 0,
      is_active: form.is_active,
    };

    let result;
    if (isEditing.value) {
      result = await categoriesStore.updateCategory(route.params.id, data);
      console.log('Categoría actualizada:', result);
    } else {
      result = await categoriesStore.createCategory(data);
      console.log('Categoría creada:', result);
    }

    router.push('/menu/categories');
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al guardar la categoría';
    console.error('Error saving category:', err);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/menu/categories');
}
</script>

<style scoped>
.category-form {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
}

.form-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  border-color: #667eea;
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.is-invalid {
  border-color: #ef4444;
}

textarea.form-input {
  resize: vertical;
  font-family: inherit;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.help-text {
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Toggle Switch personalizado */
.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.toggle-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #d1d5db;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background: #667eea;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* Botones */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

/* Responsive */
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-group.full-width {
    grid-column: 1;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>