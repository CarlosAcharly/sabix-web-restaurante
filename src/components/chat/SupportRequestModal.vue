<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>
          <i class="pi pi-question-circle"></i>
          Solicitar Soporte
        </h3>
        <button class="modal-close" @click="$emit('close')">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="info-message">
          <i class="pi pi-info-circle"></i>
          <p>
            Un administrador se unirá a la conversación del pedido 
            <strong>#{{ conversation?.order_id }}</strong> para ayudarte.
          </p>
        </div>

        <div class="form-group">
          <label for="reason">Motivo de la solicitud *</label>
          <textarea
            id="reason"
            v-model="form.reason"
            placeholder="Describe el problema o motivo por el cual necesitas soporte..."
            rows="4"
            :class="{ 'invalid': errors.reason }"
          ></textarea>
          <small v-if="errors.reason" class="error-text">{{ errors.reason }}</small>
        </div>

        <div class="form-group">
          <label for="priority">Prioridad</label>
          <select id="priority" v-model="form.priority" class="form-select">
            <option value="low">Baja</option>
            <option value="medium" selected>Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">
          Cancelar
        </button>
        <button 
          class="btn-primary" 
          :disabled="loading"
          @click="handleSubmit"
        >
          <i class="pi pi-send"></i>
          {{ loading ? 'Enviando...' : 'Solicitar Soporte' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  conversation: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'submit']);

const loading = ref(false);

const form = reactive({
  reason: '',
  priority: 'medium',
});

const errors = reactive({
  reason: '',
});

function handleSubmit() {
  // Validar
  if (!form.reason.trim()) {
    errors.reason = 'El motivo es requerido';
    return;
  }

  loading.value = true;
  
  emit('submit', {
    reason: form.reason.trim(),
    priority: form.priority,
  });
  
  // Resetear loading después de un tiempo (el componente padre cerrará el modal)
  setTimeout(() => {
    loading.value = false;
  }, 3000);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h3 i {
  color: var(--color-primary-2);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #1a1a2e;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.info-message {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(126, 9, 126, 0.05);
  border-radius: 10px;
  border-left: 3px solid var(--color-primary-2);
  margin-bottom: 1.5rem;
}

.info-message i {
  color: var(--color-primary-2);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.info-message p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
}

.info-message strong {
  color: #1a1a2e;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group textarea,
.form-group .form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s;
  background: #fafafa;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group textarea:focus,
.form-group .form-select:focus {
  outline: none;
  border-color: var(--color-primary-3);
  background: white;
  box-shadow: 0 0 0 3px rgba(188, 74, 185, 0.1);
}

.form-group textarea.invalid {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.error-text {
  display: block;
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
}

.btn-secondary,
.btn-primary {
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(126, 9, 126, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>