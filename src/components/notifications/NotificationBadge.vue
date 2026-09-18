<template>
  <span v-if="count > 0" class="notification-badge" :class="sizeClass">
    {{ count > 99 ? '99+' : count }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
});

const sizeClass = computed(() => `badge-${props.size}`);
</script>

<style scoped>
.notification-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.7rem;
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  animation: pulse 2s infinite;
}

.badge-sm {
  font-size: 0.6rem;
  min-width: 16px;
  height: 16px;
  top: -3px;
  right: -3px;
}

.badge-lg {
  font-size: 0.8rem;
  min-width: 22px;
  height: 22px;
  top: -6px;
  right: -6px;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>