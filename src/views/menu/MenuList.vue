<template>
  <div class="menu-list">
    <div class="page-header">
      <div>
        <h1>Mi Menú</h1>
        <p class="subtitle">Gestiona los productos de tu restaurante</p>
      </div>
      <Button
        label="Nuevo Producto"
        icon="pi pi-plus"
        @click="$router.push('/menu/create')"
      />
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <div class="filters-left">
        <div class="search-wrapper">
          <i class="pi pi-search"></i>
          <InputText
            v-model="searchQuery"
            placeholder="Buscar productos..."
            class="search-input"
            @input="applyFilters"
          />
        </div>
        
        <select
          v-model="filterCategory"
          class="filter-select"
          @change="applyFilters"
        >
          <option value="">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
        
        <select
          v-model="filterAvailability"
          class="filter-select"
          @change="applyFilters"
        >
          <option value="">Disponibilidad</option>
          <option value="true">Disponibles</option>
          <option value="false">No disponibles</option>
        </select>
      </div>
      
      <div class="filters-right">
        <select
          v-model="sortBy"
          class="filter-select"
          @change="applyFilters"
        >
          <option value="-created_at">Más recientes</option>
          <option value="created_at">Más antiguos</option>
          <option value="name">Nombre A-Z</option>
          <option value="-name">Nombre Z-A</option>
          <option value="price">Precio menor</option>
          <option value="-price">Precio mayor</option>
        </select>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando productos...</span>
    </div>

    <!-- Grid de productos -->
    <div v-else-if="products.length > 0" class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="viewProduct(product)"
      >
        <div class="product-image">
          <img
            v-if="product.image"
            :src="product.image"
            :alt="product.name"
            loading="lazy"
          />
          <div v-else class="image-placeholder">
            <i class="pi pi-image"></i>
          </div>
          <div class="product-badges">
            <span
              v-if="product.is_featured"
              class="badge badge-warning"
            >
              Destacado
            </span>
            <span
              v-if="!product.is_available"
              class="badge badge-danger"
            >
              No disponible
            </span>
          </div>
        </div>
        
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="product-description">{{ product.description || 'Sin descripción' }}</p>
          <div class="product-footer">
            <span class="product-price">${{ product.price }}</span>
            <span v-if="product.discount_price" class="product-discount">
              ${{ product.discount_price }}
            </span>
            <span class="product-category">{{ product.category_name }}</span>
          </div>
          <div class="product-actions">
            <button
              class="action-btn"
              @click.stop="viewProduct(product)"
              title="Ver detalles"
            >
              <i class="pi pi-eye"></i>
            </button>
            <button
              class="action-btn"
              @click.stop="$router.push(`/menu/${product.id}/edit`)"
              title="Editar"
            >
              <i class="pi pi-pencil"></i>
            </button>
            <button
              class="action-btn"
              :class="product.is_available ? 'btn-warning' : 'btn-success'"
              @click.stop="toggleAvailability(product)"
              :title="product.is_available ? 'Ocultar' : 'Mostrar'"
            >
              <i :class="product.is_available ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
            <button
              class="action-btn btn-danger"
              @click.stop="confirmDelete(product)"
              title="Eliminar"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="empty-state">
      <i class="pi pi-inbox"></i>
      <h3>No hay productos</h3>
      <p>Comienza agregando tu primer producto al menú</p>
      <Button
        label="Agregar Producto"
        icon="pi pi-plus"
        @click="$router.push('/menu/create')"
      />
    </div>

    <!-- Paginación -->
    <div v-if="totalProducts > 0" class="pagination">
      <button
        class="page-btn"
        :disabled="pagination.page <= 1"
        @click="onPageChange(pagination.page - 1)"
      >
        <i class="pi pi-chevron-left"></i>
      </button>
      <span class="page-info">
        Página {{ pagination.page }} de {{ Math.ceil(totalProducts / pagination.pageSize) }}
      </span>
      <button
        class="page-btn"
        :disabled="pagination.page >= Math.ceil(totalProducts / pagination.pageSize)"
        @click="onPageChange(pagination.page + 1)"
      >
        <i class="pi pi-chevron-right"></i>
      </button>
    </div>

    <!-- Dialog de confirmación de eliminación -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="showDeleteDialog = false">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>Eliminar Producto</h3>
          <button class="dialog-close" @click="showDeleteDialog = false">×</button>
        </div>
        <div class="dialog-body">
          <div class="delete-confirmation">
            <i class="pi pi-exclamation-triangle" style="color: #f59e0b; font-size: 2rem;"></i>
            <p>
              ¿Estás seguro de eliminar el producto <strong>{{ productToDelete?.name }}</strong>?
            </p>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="showDeleteDialog = false">Cancelar</button>
          <button class="btn-danger" :disabled="deleting" @click="deleteProduct">
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProductsStore } from '@/stores/products';
import { useCategoriesStore } from '@/stores/categories';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();

// Estado
const searchQuery = ref('');
const filterCategory = ref('');
const filterAvailability = ref('');
const sortBy = ref('-created_at');
const showDeleteDialog = ref(false);
const productToDelete = ref(null);
const deleting = ref(false);

// Computed
const products = computed(() => productsStore.products);
const loading = computed(() => productsStore.loading);
const totalProducts = computed(() => productsStore.totalProducts);
const pagination = computed(() => productsStore.pagination);
const categories = computed(() => categoriesStore.categories);

// Cargar datos
async function loadData() {
  try {
    await categoriesStore.fetchCategories();
    await loadProducts();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los datos',
      life: 3000,
    });
  }
}

async function loadProducts() {
  const params = {
    page: 1,
    search: searchQuery.value || undefined,
    category: filterCategory.value || undefined,
    is_available: filterAvailability.value !== '' ? filterAvailability.value === 'true' : undefined,
    ordering: sortBy.value || undefined,
  };
  
  await productsStore.fetchProducts(params);
}

function applyFilters() {
  loadProducts();
}

function onPageChange(page) {
  const params = {
    page: page,
    pageSize: pagination.value.pageSize,
    search: searchQuery.value || undefined,
    category: filterCategory.value || undefined,
    is_available: filterAvailability.value !== '' ? filterAvailability.value === 'true' : undefined,
    ordering: sortBy.value || undefined,
  };
  productsStore.fetchProducts(params);
}

function viewProduct(product) {
  router.push(`/menu/${product.id}`);
}

async function toggleAvailability(product) {
  try {
    await productsStore.toggleProductAvailability(product.id);
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Producto ${product.is_available ? 'ocultado' : 'mostrado'} correctamente`,
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cambiar la disponibilidad',
      life: 3000,
    });
  }
}

function confirmDelete(product) {
  productToDelete.value = product;
  showDeleteDialog.value = true;
}

async function deleteProduct() {
  if (!productToDelete.value) return;
  
  deleting.value = true;
  try {
    await productsStore.deleteProduct(productToDelete.value.id);
    showDeleteDialog.value = false;
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Producto eliminado correctamente',
      life: 3000,
    });
    await loadProducts();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo eliminar el producto',
      life: 3000,
    });
  } finally {
    deleting.value = false;
    productToDelete.value = null;
  }
}

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.menu-list {
  padding: 1rem;
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

.filters-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.filters-left {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  flex: 1;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-wrapper i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-input {
  padding-left: 2.5rem !important;
  width: 100%;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  min-width: 150px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #6b7280;
}

.loading-state i {
  font-size: 2rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-image {
  position: relative;
  height: 180px;
  background: #f3f4f6;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 3rem;
}

.product-badges {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.badge {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
}

.badge-warning {
  background: #f59e0b;
}

.badge-danger {
  background: #ef4444;
}

.product-info {
  padding: 1rem;
}

.product-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 0.25rem;
}

.product-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.5rem;
}

.product-footer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.product-price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2563eb;
}

.product-discount {
  font-size: 0.85rem;
  color: #dc2626;
  text-decoration: line-through;
}

.product-category {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  margin-left: auto;
}

.product-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #1a1a2e;
}

.action-btn.btn-danger:hover {
  background: #fee2e2;
  color: #dc2626;
}

.action-btn.btn-warning:hover {
  background: #fef3c7;
  color: #d97706;
}

.action-btn.btn-success:hover {
  background: #dcfce7;
  color: #16a34a;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.empty-state i {
  font-size: 4rem;
  color: #d1d5db;
  display: block;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 1.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 12px;
  max-width: 450px;
  width: 90%;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1a1a2e;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.dialog-close:hover {
  color: #1a1a2e;
}

.dialog-body {
  padding: 1.5rem;
}

.dialog-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-danger {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  cursor: pointer;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-confirmation {
  text-align: center;
}

.delete-confirmation i {
  margin-bottom: 1rem;
}

.delete-confirmation p {
  color: #6b7280;
  margin: 0.5rem 0;
}
</style>