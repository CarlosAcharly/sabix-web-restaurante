<template>
  <span class="status-badge" :class="statusClass">
    <span class="status-dot" :class="statusDotClass"></span>
    {{ displayText }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const statusConfig = {
  pending: {
    label: 'Pendiente',
    class: 'status-pending',
    dot: 'dot-warning',
  },
  confirmed: {
    label: 'Confirmado',
    class: 'status-confirmed',
    dot: 'dot-info',
  },
  preparing: {
    label: 'En preparación',
    class: 'status-preparing',
    dot: 'dot-info',
  },
  ready: {
    label: 'Listo',
    class: 'status-ready',
    dot: 'dot-success',
  },
  in_delivery: {
    label: 'En camino',
    class: 'status-delivery',
    dot: 'dot-primary',
  },
  delivered: {
    label: 'Entregado',
    class: 'status-delivered',
    dot: 'dot-success',
  },
  cancelled: {
    label: 'Cancelado',
    class: 'status-cancelled',
    dot: 'dot-danger',
  },
  rejected: {
    label: 'Rechazado',
    class: 'status-rejected',
    dot: 'dot-danger',
  },
};

const statusInfo = computed(() => statusConfig[props.status] || statusConfig.pending);
const statusClass = computed(() => statusInfo.value.class);
const statusDotClass = computed(() => statusInfo.value.dot);
const displayText = computed(() => statusInfo.value.label);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-warning {
  background: #f59e0b;
}
.dot-info {
  background: #3b82f6;
}
.dot-success {
  background: #22c55e;
}
.dot-primary {
  background: #8b5cf6;
}
.dot-danger {
  background: #ef4444;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-confirmed {
  background: #dbeafe;
  color: #1e40af;
}
.status-preparing {
  background: #dbeafe;
  color: #1e40af;
}
.status-ready {
  background: #dcfce7;
  color: #166534;
}
.status-delivery {
  background: #ede9fe;
  color: #5b21b6;
}
.status-delivered {
  background: #dcfce7;
  color: #166534;
}
.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
}
.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}
</style>