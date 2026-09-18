<template>
  <div class="category-list">
    <div class="page-header">
      <div>
        <h1>Categorías del Menú</h1>
        <p class="subtitle">Organiza tus productos por categorías</p>
      </div>
      <Button
        label="Nueva Categoría"
        icon="pi pi-plus"
        @click="$router.push('/menu/categories/create')"
      />
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando categorías...</span>
    </div>

    <!-- Tabla de categorías -->
    <DataTable
      v-else
      :value="categories"
      class="p-datatable-sm"
      paginator
      :rows="10"
      :totalRecords="pagination.count"
      :loading="loading"
      @page="onPageChange"
      responsiveLayout="scroll"
    >
      <Column field="order" header="Orden" style="width: 80px">
        <template #body="{ data }">
          <span class="order-badge">{{ data.order || 0 }}</span>
        </template>
      </Column>

      <Column field="name" header="Nombre">
        <template #body="{ data }">
          <div class="category-name">
            <span class="category-icon">{{ data.icon || '📁' }}</span>
            <span>{{ data.name }}</span>
          </div>
        </template>
      </Column>

      <Column field="description" header="Descripción" style="max-width: 300px">
        <template #body="{ data }">
          <span class="description-text">{{ data.description || 'Sin descripción' }}</span>
        </template>
      </Column>

      <Column field="product_count" header="Productos" style="width: 100px">
        <template #body="{ data }">
          <span class="product-count">{{ data.product_count || 0 }}</span>
        </template>
      </Column>

      <Column field="is_active" header="Estado" style="width: 120px">
        <template #body="{ data }">
          <Tag
            :value="data.is_active ? 'Activo' : 'Inactivo'"
            :severity="data.is_active ? 'success' : 'danger'"
            size="small"
          />
        </template>
      </Column>

      <Column header="Acciones" style="width: 150px" frozen>
        <template #body="{ data }">
          <div class="action-buttons">
            <Button
              icon="pi pi-eye"
              text
              rounded
              size="small"
              @click="viewCategory(data)"
              tooltip="Ver detalles"
            />
            <Button
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              @click="$router.push(`/menu/categories/${data.id}/edit`)"
              tooltip="Editar"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="confirmDelete(data)"
              tooltip="Eliminar"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Diálogo de confirmación de eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Eliminar Categoría"
      :modal="true"
      :closable="false"
      style="max-width: 450px"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle" style="color: #f59e0b; font-size: 2rem;"></i>
        <p>
          ¿Estás seguro de eliminar la categoría <strong>{{ categoryToDelete?.name }}</strong>?
        </p>
        <p v-if="categoryToDelete?.product_count > 0" class="warning-text">
          ⚠️ Esta categoría tiene {{ categoryToDelete.product_count }} productos asociados.
          Si la eliminas, los productos quedarán sin categoría.
        </p>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          severity="danger"
          :loading="deleting"
          @click="deleteCategory"
        />
      </template>
    </Dialog>

    <!-- Dialog de detalles -->
    <Dialog
      v-model:visible="showDetailDialog"
      header="Detalles de Categoría"
      :modal="true"
      style="max-width: 500px"
    >
      <div v-if="selectedCategory" class="category-detail">
        <div class="detail-row">
          <span class="label">Nombre:</span>
          <span class="value">{{ selectedCategory.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Ícono:</span>
          <span class="value">{{ selectedCategory.icon || '📁' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Descripción:</span>
          <span class="value">{{ selectedCategory.description || 'Sin descripción' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Estado:</span>
          <Tag
            :value="selectedCategory.is_active ? 'Activo' : 'Inactivo'"
            :severity="selectedCategory.is_active ? 'success' : 'danger'"
          />
        </div>
        <div class="detail-row">
          <span class="label">Productos:</span>
          <span class="value">{{ selectedCategory.product_count || 0 }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Orden:</span>
          <span class="value">{{ selectedCategory.order || 0 }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Creada:</span>
          <span class="value">{{ formatDate(selectedCategory.created_at) }}</span>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useCategoriesStore } from '@/stores/categories';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const categoriesStore = useCategoriesStore();

// Estado local
const showDeleteDialog = ref(false);
const showDetailDialog = ref(false);
const categoryToDelete = ref(null);
const selectedCategory = ref(null);
const deleting = ref(false);

// Computed
const categories = categoriesStore.categories;
const loading = categoriesStore.loading;
const pagination = categoriesStore.pagination;

// Métodos
async function loadCategories() {
  try {
    await categoriesStore.fetchCategories({ page: 1 });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar las categorías',
      life: 3000,
    });
  }
}

function onPageChange(event) {
  categoriesStore.fetchCategories({ page: event.page + 1, pageSize: event.rows });
}

function viewCategory(category) {
  selectedCategory.value = category;
  showDetailDialog.value = true;
}

function confirmDelete(category) {
  categoryToDelete.value = category;
  showDeleteDialog.value = true;
}

async function deleteCategory() {
  if (!categoryToDelete.value) return;
  
  deleting.value = true;
  try {
    await categoriesStore.deleteCategory(categoryToDelete.value.id);
    showDeleteDialog.value = false;
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Categoría eliminada correctamente',
      life: 3000,
    });
    await loadCategories();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo eliminar la categoría',
      life: 3000,
    });
  } finally {
    deleting.value = false;
    categoryToDelete.value = null;
  }
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Lifecycle
onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.category-list {
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

.category-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-icon {
  font-size: 1.2rem;
}

.order-badge {
  display: inline-block;
  background: #f3f4f6;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #6b7280;
}

.description-text {
  color: #6b7280;
  font-size: 0.9rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-count {
  display: inline-block;
  background: #e0e7ff;
  color: #2563eb;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.delete-confirmation {
  text-align: center;
  padding: 1rem 0;
}

.delete-confirmation i {
  margin-bottom: 1rem;
}

.delete-confirmation p {
  color: #6b7280;
  margin: 0.5rem 0;
}

.delete-confirmation .warning-text {
  color: #f59e0b;
  font-size: 0.9rem;
  background: #fef3c7;
  padding: 0.5rem;
  border-radius: 6px;
}

.category-detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #6b7280;
  font-weight: 500;
}

.detail-row .value {
  color: #1a1a2e;
}
</style>