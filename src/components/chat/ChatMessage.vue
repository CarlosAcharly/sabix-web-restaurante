<template>
  <div 
    class="chat-message" 
    :class="{ 
      'is-mine': message.is_mine,
      'is-system': message.message_type === 'system',
      'is-deleted': message.is_deleted
    }"
  >
    <!-- Avatar (solo para mensajes de otros) -->
    <div v-if="showAvatar && !message.is_mine" class="message-avatar">
      <div class="avatar-circle">
        {{ getInitials(message.sender?.full_name) }}
      </div>
    </div>

    <!-- Contenido -->
    <div class="message-content">
      <!-- Nombre del remitente -->
      <div v-if="!message.is_mine && !isSystem" class="message-sender">
        <span class="sender-name">{{ message.sender?.full_name }}</span>
        <span v-if="message.sender?.user_type" class="sender-role">
          {{ getRoleLabel(message.sender.user_type) }}
        </span>
      </div>

      <!-- Respuesta a mensaje -->
      <div v-if="message.reply_to" class="reply-preview">
        <div class="reply-bar"></div>
        <div class="reply-content">
          <span class="reply-sender">{{ message.reply_to.sender_name }}</span>
          <span class="reply-text">{{ message.reply_to.content }}</span>
        </div>
      </div>

      <!-- Burbuja del mensaje -->
      <div class="message-bubble" :class="getBubbleClass()">
        <!-- Mensaje de sistema -->
        <template v-if="isSystem">
          <i class="pi pi-info-circle"></i>
          <span>{{ message.content }}</span>
        </template>

        <!-- Mensaje eliminado -->
        <template v-else-if="message.is_deleted">
          <i class="pi pi-ban"></i>
          <em>Mensaje eliminado</em>
        </template>

        <!-- Mensaje de imagen -->
        <template v-else-if="message.message_type === 'image'">
          <p v-if="message.content">{{ message.content }}</p>
          <img 
            v-if="message.metadata?.image_url" 
            :src="message.metadata.image_url" 
            alt="Imagen"
            class="message-image"
            @click="openImage(message.metadata.image_url)"
          />
        </template>

        <!-- Mensaje de ubicación -->
        <template v-else-if="message.message_type === 'location'">
          <p v-if="message.content">{{ message.content }}</p>
          <div class="location-preview">
            <i class="pi pi-map-marker"></i>
            <span>{{ message.metadata?.address || 'Ubicación compartida' }}</span>
          </div>
          <a 
            v-if="message.metadata?.lat && message.metadata?.lng"
            :href="`https://www.google.com/maps?q=${message.metadata.lat},${message.metadata.lng}`"
            target="_blank"
            class="map-link"
          >
            Ver en Google Maps <i class="pi pi-external-link"></i>
          </a>
        </template>

        <!-- Mensaje de texto -->
        <template v-else>
          {{ message.content }}
        </template>

        <!-- Hora y estado -->
        <div class="message-meta" v-if="!isSystem">
          <span class="message-time">{{ formatTime(message.created_at) }}</span>
          <span v-if="message.is_mine" class="message-status">
            <i :class="message.is_read ? 'pi pi-check-circle' : 'pi pi-check'"></i>
          </span>
        </div>
      </div>

      <!-- Acciones del mensaje -->
      <div v-if="!isSystem && !message.is_deleted" class="message-actions">
        <button 
          class="action-btn"
          @click="$emit('reply', message)"
          title="Responder"
        >
          <i class="pi pi-reply"></i>
        </button>
        <button 
          v-if="message.is_mine"
          class="action-btn delete"
          @click="$emit('delete', message)"
          title="Eliminar"
        >
          <i class="pi pi-trash"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  currentUserId: {
    type: Number,
    default: null,
  },
  showAvatar: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['reply', 'delete']);

const isSystem = props.message.message_type === 'system';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length >= 2 
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() 
    : parts[0][0].toUpperCase();
}

function getRoleLabel(role) {
  const labels = {
    client: 'Cliente',
    restaurant: 'Restaurante',
    delivery: 'Repartidor',
    support: 'Soporte',
  };
  return labels[role] || role;
}

function getBubbleClass() {
  if (props.message.message_type === 'system') return 'bubble-system';
  if (props.message.is_mine) return 'bubble-mine';
  return 'bubble-other';
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function openImage(url) {
  window.open(url, '_blank');
}
</script>

<style scoped>
.chat-message {
  display: flex;
  gap: 0.5rem;
  max-width: 80%;
  animation: fadeIn 0.2s ease;
}

.chat-message.is-mine {
  margin-left: auto;
  flex-direction: row-reverse;
}

.chat-message.is-system {
  max-width: 100%;
  justify-content: center;
  margin: 0.5rem 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Avatar */
.message-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Contenido */
.message-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.chat-message.is-mine .message-content {
  align-items: flex-end;
}

/* Sender */
.message-sender {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.15rem;
  padding-left: 0.5rem;
}

.sender-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.sender-role {
  font-size: 0.65rem;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
}

/* Reply preview */
.reply-preview {
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: rgba(126, 9, 126, 0.05);
  border-radius: 8px;
  margin-bottom: 0.25rem;
  max-width: 100%;
}

.chat-message.is-mine .reply-preview {
  background: rgba(255, 255, 255, 0.2);
}

.reply-bar {
  width: 3px;
  background: var(--color-primary-2);
  border-radius: 2px;
  flex-shrink: 0;
}

.reply-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.reply-sender {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-primary-2);
}

.reply-text {
  font-size: 0.7rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Burbuja */
.message-bubble {
  padding: 0.6rem 0.85rem;
  border-radius: 14px;
  font-size: 0.85rem;
  line-height: 1.4;
  word-wrap: break-word;
  position: relative;
}

.bubble-mine {
  background: var(--color-primary-2);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background: white;
  color: #1a1a2e;
  border: 1px solid #e5e7eb;
  border-bottom-left-radius: 4px;
}

.bubble-system {
  background: rgba(126, 9, 126, 0.06);
  color: #6b7280;
  font-size: 0.75rem;
  font-style: italic;
  border-radius: 20px;
  padding: 0.4rem 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
  border: 1px solid rgba(126, 9, 126, 0.1);
}

.is-deleted .message-bubble {
  opacity: 0.6;
  font-style: italic;
}

/* Meta */
.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.message-time {
  font-size: 0.65rem;
  opacity: 0.7;
}

.bubble-mine .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.bubble-other .message-time {
  color: #9ca3af;
}

.message-status i {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
}

/* Acciones */
.message-actions {
  display: flex;
  gap: 0.15rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.chat-message:hover .message-actions {
  opacity: 1;
}

.chat-message.is-mine .message-actions {
  flex-direction: row-reverse;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 50%;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(126, 9, 126, 0.1);
  color: var(--color-primary-2);
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Imagen */
.message-image {
  max-width: 250px;
  max-height: 200px;
  border-radius: 8px;
  margin-top: 0.25rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image:hover {
  transform: scale(1.02);
}

/* Ubicación */
.location-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.35rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 0.8rem;
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-primary-2);
  text-decoration: none;
  font-weight: 500;
}

.map-link:hover {
  text-decoration: underline;
}
</style>