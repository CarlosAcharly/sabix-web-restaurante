<template>
  <div class="chat-window">
    <!-- Header del chat -->
    <div class="chat-header" v-if="conversation">
      <div class="chat-header-info">
        <div class="header-avatar" :class="getStatusClass(conversation.order_status)">
          <i :class="getOrderIcon(conversation.order_status)"></i>
        </div>
        <div class="header-details">
          <h3>Pedido #{{ conversation.order_id }}</h3>
          <div class="header-meta">
            <span class="status-badge" :class="getStatusClass(conversation.order_status)">
              {{ conversation.order_status_display }}
            </span>
            <span class="total">${{ conversation.order_total }}</span>
          </div>
        </div>
      </div>
      
      <div class="chat-header-actions">
        <button 
          v-if="canRequestSupport" 
          class="action-btn support-btn"
          @click="$emit('request-support')"
          title="Solicitar soporte"
        >
          <i class="pi pi-question-circle"></i>
        </button>
        <button 
          v-if="canClose" 
          class="action-btn close-btn"
          @click="$emit('close-conversation')"
          title="Cerrar conversación"
        >
          <i class="pi pi-times"></i>
        </button>
        <button 
          class="action-btn"
          @click="$emit('toggle-participants')"
          title="Ver participantes"
        >
          <i class="pi pi-users"></i>
        </button>
      </div>
    </div>

    <!-- Participantes -->
    <div class="participants-bar" v-if="conversation">
      <div 
        v-for="participant in conversation.participants" 
        :key="participant.id"
        class="participant-chip"
        :class="{ 
          'is-me': participant.user.id === currentUserId,
          'is-online': onlineUsers.includes(participant.user.id)
        }"
      >
        <div class="participant-avatar">
          {{ getInitials(participant.user.full_name) }}
        </div>
        <span class="participant-name">{{ participant.user.full_name }}</span>
        <span class="participant-role">{{ participant.role_display }}</span>
      </div>
    </div>

    <!-- Mensajes -->
    <div
      class="chat-messages"
      :class="{ 'messages-positioning': !isMessagesPositioned }"
      ref="messagesContainer"
    >
      <div v-if="loading" class="loading-messages">
        <i class="pi pi-spin pi-spinner"></i>
        <span>Cargando mensajes...</span>
      </div>
      
      <div v-else-if="messages.length === 0" class="empty-messages">
        <i class="pi pi-comments"></i>
        <p>No hay mensajes aún</p>
        <span>Envía el primer mensaje</span>
      </div>
      
      <template v-else>
        <div 
          v-for="(message, index) in messages" 
          :key="message.id"
          class="message-wrapper"
          :class="{ 'with-avatar': shouldShowAvatar(message, index) }"
        >
          <ChatMessage
            :message="message"
            :current-user-id="currentUserId"
            :show-avatar="shouldShowAvatar(message, index)"
            @reply="$emit('reply-message', message)"
            @delete="$emit('delete-message', message)"
          />
        </div>
        
        <!-- Indicador de "escribiendo..." -->
        <div v-if="typingUsers.length > 0" class="typing-indicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">
            {{ typingUsers.map(u => u.full_name).join(', ') }} 
            {{ typingUsers.length === 1 ? 'está escribiendo' : 'están escribiendo' }}...
          </span>
        </div>
      </template>
    </div>

    <!-- Input -->
    <ChatInput
      :disabled="!canSendMessages"
      :sending="sending"
      :reply-to="replyTo"
      @send="handleSendMessage"
      @typing="handleTyping"
      @cancel-reply="replyTo = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ChatMessage from './ChatMessage.vue';
import ChatInput from './ChatInput.vue';

const props = defineProps({
  conversation: {
    type: Object,
    default: null,
  },
  messages: {
    type: Array,
    default: () => [],
  },
  currentUserId: {
    type: Number,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  sending: {
    type: Boolean,
    default: false,
  },
  typingUsers: {
    type: Array,
    default: () => [],
  },
  onlineUsers: {
    type: Array,
    default: () => [],
  },
  canSendMessages: {
    type: Boolean,
    default: false,
  },
  canRequestSupport: {
    type: Boolean,
    default: false,
  },
  canClose: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'send-message',
  'reply-message',
  'delete-message',
  'request-support',
  'close-conversation',
  'toggle-participants',
  'typing',
]);

const messagesContainer = ref(null);
const replyTo = ref(null);
const isMessagesPositioned = ref(false);

function getInitials(name) {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length >= 2 
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() 
    : parts[0][0].toUpperCase();
}

function getStatusClass(status) {
  const classes = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    preparing: 'status-preparing',
    ready: 'status-ready',
    in_delivery: 'status-delivery',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  };
  return classes[status] || 'status-default';
}

function getOrderIcon(status) {
  const icons = {
    pending: 'pi pi-clock',
    confirmed: 'pi pi-check-circle',
    preparing: 'pi pi-spinner',
    ready: 'pi pi-check',
    in_delivery: 'pi pi-truck',
    delivered: 'pi pi-check-circle',
    cancelled: 'pi pi-times-circle',
  };
  return icons[status] || 'pi pi-shopping-bag';
}

function shouldShowAvatar(message, index) {
  if (message.message_type === 'system') return false;
  if (message.is_mine) return false;
  
  // Mostrar avatar si es el primer mensaje o si el anterior es de otro usuario
  if (index === 0) return true;
  const prevMessage = props.messages[index - 1];
  return prevMessage.sender?.id !== message.sender?.id;
}

function handleSendMessage(content) {
  emit('send-message', {
    content,
    replyTo: replyTo.value,
  });
  replyTo.value = null;
}

function handleTyping(isTyping) {
  emit('typing', isTyping);
}

function scrollToLatestMessage() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
  isMessagesPositioned.value = true;
}

const messagePositionKey = () => [
  props.conversation?.id,
  props.messages.length,
  props.messages.at(-1)?.id,
];

watch(
  messagePositionKey,
  () => {
    isMessagesPositioned.value = false;
  },
  { flush: 'sync' }
);

watch(messagePositionKey, scrollToLatestMessage, { flush: 'post', immediate: true });
</script>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

/* Header */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  background: white;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.header-details h3 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 0.15rem 0;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.status-pending { background: #fef3c7; color: #92400e; }
.status-badge.status-confirmed { background: #dbeafe; color: #1e40af; }
.status-badge.status-preparing { background: #ede9fe; color: #5b21b6; }
.status-badge.status-ready { background: #dcfce7; color: #166534; }
.status-badge.status-delivery { background: #ede9fe; color: #5b21b6; }
.status-badge.status-delivered { background: #dcfce7; color: #166534; }
.status-badge.status-cancelled { background: #fee2e2; color: #991b1b; }

.total {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-primary-2);
}

.chat-header-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #1a1a2e;
}

.support-btn:hover {
  background: #fef3c7;
  color: #d97706;
}

.close-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Participantes */
.participants-bar {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
  overflow-x: auto;
}

.participants-bar::-webkit-scrollbar {
  height: 4px;
}

.participants-bar::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.participant-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  background: white;
  border-radius: 20px;
  font-size: 0.75rem;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.participant-chip.is-me {
  border-color: var(--color-primary-3);
  background: rgba(126, 9, 126, 0.05);
}

.participant-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-primary-2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 600;
}

.participant-name {
  font-weight: 500;
  color: #374151;
}

.participant-role {
  font-size: 0.65rem;
  color: #9ca3af;
  text-transform: capitalize;
}

/* Mensajes */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-messages.messages-positioning {
  visibility: hidden;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--color-primary-3);
  border-radius: 3px;
}

.loading-messages,
.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  gap: 0.5rem;
}

.loading-messages i {
  font-size: 1.5rem;
}

.empty-messages i {
  font-size: 3rem;
  color: #d1d5db;
}

.empty-messages p {
  font-weight: 500;
  color: #6b7280;
  margin: 0;
}

.empty-messages span {
  font-size: 0.8rem;
}

/* Indicador de escribiendo */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border-radius: 16px;
  align-self: flex-start;
  max-width: 200px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.typing-dots {
  display: flex;
  gap: 0.15rem;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary-3);
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.6; }
  40% { transform: scale(1); opacity: 1; }
}

.typing-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}
</style>