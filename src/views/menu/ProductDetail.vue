<template>
  <div class="product-detail">
    <div class="page-header">
      <div>
        <Button
          icon="pi pi-arrow-left"
          text
          label="Volver"
          @click="$router.push('/menu')"
        />
        <h1>Detalle del Producto</h1>
      </div>
      <div class="action-buttons">
        <Button
          icon="pi pi-pencil"
          label="Editar"
          @click="$router.push(`/menu/${product.id}/edit`)"
        />
        <Button
          icon="pi pi-trash"
          label="Eliminar"
          severity="danger"
          @click="confirmDelete"
        />
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando producto...</span>
    </div>

    <div v-else-if="product" class="detail-content">
      <div class="detail-grid">
        <div class="detail-card">
          <h3>Información General</h3>
          <div class="detail-row">
            <span class="label">Nombre:</span>
            <span class="value">{{ product.name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Descripción:</span>
            <span class="value">{{ product.description || 'Sin descripción' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Precio:</span>
            <span class="value price">${{ product.price }}</span>
          </div>
          <div class="detail-row" v-if="product.discount_price">
            <span class="label">Precio con descuento:</span>
            <span class="value price-discount">${{ product.discount_price }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Categoría:</span>
            <span class="value">{{ product.category_name || 'Sin categoría' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Estado:</span>
            <Tag
              :value="product.is_available ? 'Disponible' : 'No disponible'"
              :severity="product.is_available ? 'success' : 'danger'"
            />
          </div>
        </div>

        <div class="detail-card">
          <h3>Detalles Adicionales</h3>
          <div class="detail-row">
            <span class="label">Stock:</span>
            <span class="value">{{ product.stock || 0 }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Tiempo de preparación:</span>
            <span class="value">{{ product.preparation_time || 0 }} min</span>
          </div>
          <div class="detail-row">
            <span class="label">Destacado:</span>
            <Tag
              :value="product.is_featured ? 'Sí' : 'No'"
              :severity="product.is_featured ? 'success' : 'secondary'"
            />
          </div>
          <div class="detail-row">
            <span class="label">Vegetariano:</span>
            <Tag
              :value="product.is_vegetarian ? 'Sí' : 'No'"
              :severity="product.is_vegetarian ? 'success' : 'secondary'"
            />
          </div>
          <div class="detail-row">
            <span class="label">Vegano:</span>
            <Tag
              :value="product.is_vegan ? 'Sí' : 'No'"
              :severity="product.is_vegan ? 'success' : 'secondary'"
            />
          </div>
          <div class="detail-row">
            <span class="label">Sin gluten:</span>
            <Tag
              :value="product.is_gluten_free ? 'Sí' : 'No'"
              :severity="product.is_gluten_free ? 'success' : 'secondary'"
            />
          </div>
        </div>
      </div>

      <!-- Opciones del producto -->
      <div class="options-section" v-if="product.options?.length">
        <h3>Opciones de Personalización</h3>
        <div v-for="option in product.options" :key="option.id" class="option-card">
          <div class="option-header">
            <span class="option-name">{{ option.name }}</span>
            <Tag
              :value="option.is_required ? 'Requerido' : 'Opcional'"
              :severity="option.is_required ? 'info' : 'secondary'"
              size="small"
            />
          </div>
          <div class="option-choices">
            <span v-for="choice in option.choices" :key="choice.id" class="choice-badge">
              {{ choice.value }}
              <span v-if="choice.price_adjustment > 0" class="price-adjustment">
                +${{ choice.price_adjustment }}
              </span>
              <span v-if="choice.is_default" class="default-badge">Default</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog de confirmación de eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Eliminar Producto"
      :modal="true"
      :closable="false"
      style="max-width: 450px"
    >
      <div class="delete-confirmation">
        <i class="pi pi-exclamation-triangle" style="color: #f59e0b; font-size: 2rem;"></i>
        <p>
          ¿Estás seguro de eliminar el producto <strong>{{ product?.name }}</strong>?
        </p>
        <p class="warning-text">Esta acción no se puede deshacer.</p>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          icon="pi pi-trash"
          severity="danger"
          :loading="deleting"
          @click="deleteProduct"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useProductsStore } from '@/stores/products';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const productsStore = useProductsStore();

const product = ref(null);
const loading = ref(false);
const deleting = ref(false);
const showDeleteDialog = ref(false);

async function loadProduct() {
  const id = route.params.id;
  if (!id) {
    router.push('/menu');
    return;
  }

  loading.value = true;
  try {
    product.value = await productsStore.fetchProduct(id);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar el producto',
      life: 3000,
    });
    router.push('/menu');
  } finally {
    loading.value = false;
  }
}

function confirmDelete() {
  showDeleteDialog.value = true;
}

async function deleteProduct() {
  if (!product.value) return;
  
  deleting.value = true;
  try {
    await productsStore.deleteProduct(product.value.id);
    showDeleteDialog.value = false;
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Producto eliminado correctamente',
      life: 3000,
    });
    router.push('/menu');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo eliminar el producto',
      life: 3000,
    });
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  loadProduct();
});
</script>

<style scoped>
.product-detail {
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
  margin: 0.5rem 0 0;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.detail-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.detail-card h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f9fafb;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  color: #6b7280;
  font-size: 0.9rem;
}

.detail-row .value {
  color: #1a1a2e;
  font-weight: 500;
}

.detail-row .price {
  color: #2563eb;
  font-weight: 600;
}

.detail-row .price-discount {
  color: #dc2626;
  font-weight: 600;
}

.options-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.options-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 1rem;
}

.option-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.option-card:last-child {
  margin-bottom: 0;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.option-name {
  font-weight: 600;
  color: #1a1a2e;
}

.option-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.choice-badge {
  background: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  border: 1px solid #e5e7eb;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.choice-badge .price-adjustment {
  color: #2563eb;
  font-weight: 500;
}

.choice-badge .default-badge {
  background: #e0e7ff;
  color: #2563eb;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-size: 0.6rem;
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
  color: #dc2626;
  font-size: 0.9rem;
}
</style>