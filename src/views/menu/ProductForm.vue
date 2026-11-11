<template>
  <div class="product-form">
    <div class="page-header">
      <div>
        <h1>{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</h1>
        <p class="subtitle">
          {{ isEditing ? 'Actualiza la información del producto' : 'Agrega un nuevo producto a tu menú' }}
        </p>
      </div>
      <button class="btn-secondary" @click="goBack">
        <i class="pi pi-times"></i> Cancelar
      </button>
    </div>

    <div class="form-card">
      <form @submit.prevent="submitForm">
        <div class="form-grid">
          <!-- Nombre -->
          <div class="form-group full-width">
            <label for="name">Nombre del Producto *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Ej: Pizza Margarita"
              :class="['form-input', { 'is-invalid': errors.name }]"
            />
            <small class="error-text" v-if="errors.name">{{ errors.name }}</small>
          </div>

          <!-- Descripción -->
          <div class="form-group full-width">
            <label for="description">Descripción</label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="Describe el producto, ingredientes, etc."
              rows="3"
              :class="['form-input', { 'is-invalid': errors.description }]"
            ></textarea>
            <small class="error-text" v-if="errors.description">{{ errors.description }}</small>
          </div>

          <!-- Imagen del producto -->
          <div v-if="!isEditing" class="form-group full-width">
            <label for="image">Imagen del producto</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              class="form-input"
              :class="{ 'is-invalid': errors.image }"
              @change="handleImageChange"
            />
            <small class="error-text" v-if="errors.image">{{ errors.image }}</small>
            <small v-else-if="imageFile" class="subtitle">{{ imageFile.name }}</small>
          </div>

          <!-- Precio y Descuento -->
          <div class="form-group">
            <label for="price">Precio *</label>
            <input
              id="price"
              v-model.number="form.price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :class="['form-input', { 'is-invalid': errors.price }]"
            />
            <small class="error-text" v-if="errors.price">{{ errors.price }}</small>
          </div>

          <div class="form-group">
            <label for="discount_price">Precio con Descuento</label>
            <input
              id="discount_price"
              v-model.number="form.discount_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              :class="['form-input', { 'is-invalid': errors.discount_price }]"
            />
            <small class="error-text" v-if="errors.discount_price">{{ errors.discount_price }}</small>
          </div>

          <!-- Categoría y Stock -->
          <div class="form-group">
            <label for="category">Categoría *</label>
            <select
              id="category"
              v-model="form.category"
              :class="['form-input', { 'is-invalid': errors.category }]"
            >
              <option value="">Selecciona una categoría</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <small class="error-text" v-if="errors.category">{{ errors.category }}</small>
          </div>

          <div class="form-group">
            <label for="stock">Stock</label>
            <input
              id="stock"
              v-model.number="form.stock"
              type="number"
              min="0"
              placeholder="0"
              :class="['form-input', { 'is-invalid': errors.stock }]"
            />
            <small class="error-text" v-if="errors.stock">{{ errors.stock }}</small>
          </div>

          <!-- Tiempo de preparación -->
          <div class="form-group">
            <label for="preparation_time">Tiempo de Preparación (minutos)</label>
            <input
              id="preparation_time"
              v-model.number="form.preparation_time"
              type="number"
              min="0"
              placeholder="15"
              :class="['form-input', { 'is-invalid': errors.preparation_time }]"
            />
            <small class="error-text" v-if="errors.preparation_time">{{ errors.preparation_time }}</small>
          </div>

          <!-- Estado -->
          <div class="form-group">
            <label>Disponibilidad</label>
            <div class="toggle-wrapper">
              <span class="toggle-label">{{ form.is_available ? 'Disponible' : 'No disponible' }}</span>
              <label class="toggle-switch">
                <input type="checkbox" v-model="form.is_available" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <!-- Características -->
          <div class="form-group full-width">
            <label>Características</label>
            <div class="feature-grid">
              <label class="feature-item">
                <input type="checkbox" v-model="form.is_featured" />
                <span>Producto Destacado</span>
              </label>
              <label class="feature-item">
                <input type="checkbox" v-model="form.is_vegetarian" />
                <span>Vegetariano</span>
              </label>
              <label class="feature-item">
                <input type="checkbox" v-model="form.is_vegan" />
                <span>Vegano</span>
              </label>
              <label class="feature-item">
                <input type="checkbox" v-model="form.is_gluten_free" />
                <span>Sin Gluten</span>
              </label>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="goBack">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            <i class="pi pi-save"></i>
            {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Producto') }}
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
import { useProductsStore } from '@/stores/products';
import { useCategoriesStore } from '@/stores/categories';

const router = useRouter();
const route = useRoute();
const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();

// Estado
const loading = ref(false);
const error = ref('');
const errors = reactive({});
const categories = ref([]);
const imageFile = ref(null);

const form = reactive({
  name: '',
  description: '',
  price: null,
  discount_price: null,
  category: null,
  stock: 0,
  preparation_time: 15,
  is_available: true,
  is_featured: false,
  is_vegetarian: false,
  is_vegan: false,
  is_gluten_free: false,
});

function handleImageChange(event) {
  imageFile.value = event.target.files?.[0] || null;
  delete errors.image;
}

const isEditing = computed(() => !!route.params.id);

// Cargar categorías
async function loadCategories() {
  try {
    await categoriesStore.fetchCategories();
    categories.value = categoriesStore.categories;
  } catch (error) {
    console.error('Error loading categories:', error);
    // Usar toast si está disponible
  }
}

// Cargar datos si es edición
onMounted(async () => {
  await loadCategories();
  
  if (isEditing.value) {
    try {
      loading.value = true;
      const product = await productsStore.fetchProduct(route.params.id);
      if (product) {
        Object.assign(form, {
          name: product.name || '',
          description: product.description || '',
          price: parseFloat(product.price) || null,
          discount_price: parseFloat(product.discount_price) || null,
          category: product.category || null,
          stock: product.stock || 0,
          preparation_time: product.preparation_time || 15,
          is_available: product.is_available !== undefined ? product.is_available : true,
          is_featured: product.is_featured || false,
          is_vegetarian: product.is_vegetarian || false,
          is_vegan: product.is_vegan || false,
          is_gluten_free: product.is_gluten_free || false,
        });
      }
    } catch (err) {
      console.error('Error loading product:', err);
      error.value = 'No se pudo cargar el producto';
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
    errors.name = 'El nombre del producto es requerido (mínimo 2 caracteres)';
    isValid = false;
  }

  if (!form.price || form.price <= 0) {
    errors.price = 'El precio debe ser mayor a 0';
    isValid = false;
  }

  if (!form.category) {
    errors.category = 'Selecciona una categoría';
    isValid = false;
  }

  return isValid;
}

// Enviar formulario
async function submitForm() {
  if (imageFile.value && !imageFile.value.type.startsWith('image/')) {
    errors.image = 'Selecciona un archivo de imagen válido';
    return;
  }

  if (!validateForm()) return;

  loading.value = true;
  error.value = '';

  try {
    const data = {
      name: form.name.trim(),
      description: form.description?.trim() || '',
      price: form.price,
      discount_price: form.discount_price || null,
      category: form.category,
      stock: form.stock || 0,
      preparation_time: form.preparation_time || 15,
      is_available: form.is_available,
      is_featured: form.is_featured,
      is_vegetarian: form.is_vegetarian,
      is_vegan: form.is_vegan,
      is_gluten_free: form.is_gluten_free,
    };

    let result;
    if (isEditing.value) {
      result = await productsStore.updateProduct(route.params.id, data);
      console.log('Producto actualizado:', result);
    } else {
      result = await productsStore.createProduct(data, imageFile.value);
      console.log('Producto creado:', result);
    }

    router.push('/menu');
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al guardar el producto';
    console.error('Error saving product:', err);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push('/menu');
}
</script>

<style scoped>
.product-form {
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
}

select.form-input {
  appearance: auto;
  background: white;
  cursor: pointer;
}

.error-text {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.toggle-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Toggle Switch personalizado */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
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

.feature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
}

.feature-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
  cursor: pointer;
}

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
  
  .feature-grid {
    grid-template-columns: 1fr;
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