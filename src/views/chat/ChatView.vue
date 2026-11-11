<template>
  <div class="chat-view">
    <!-- Sidebar de conversaciones -->
    <div class="chat-sidebar-container" :class="{ 'hidden-mobile': showChatWindow }">
      <ChatSidebar @select-conversation="handleSelectConversation" />
    </div>

    <!-- Ventana de chat -->
    <div class="chat-window-container" :class="{ 'hidden-mobile': !showChatWindow }">
      <div v-if="!currentConversation" class="no-conversation">
        <i class="pi pi-comments"></i>
        <h3>Selecciona una conversación</h3>
        <p>Elige una conversación de la lista para comenzar a chatear</p>
      </div>
      
      <ChatWindow
        v-else
        :conversation="currentConversation"
        :messages="messages"
        :current-user-id="currentUserId"
        :loading="loading"
        :sending="sendingMessage"
        :typing-users="typingUsers"
        :online-users="onlineUsers"
        :can-send-messages="canSendMessages"
        :can-request-support="canRequestSupport"
        :can-close="isConversationActive"
        @send-message="handleSendMessage"
        @reply-message="handleReplyMessage"
        @delete-message="handleDeleteMessage"
        @request-support="showSupportModal = true"
        @close-conversation="handleCloseConversation"
        @toggle-participants="toggleParticipants"
        @typing="handleTyping"
      />
    </div>

    <!-- Modal de solicitar soporte -->
    <SupportRequestModal
      v-if="showSupportModal"
      :conversation="currentConversation"
      @close="showSupportModal = false"
      @submit="handleRequestSupport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';
import chatWsService from '@/services/chat-websocket';
import ChatSidebar from '@/components/chat/ChatSidebar.vue';
import ChatWindow from '@/components/chat/ChatWindow.vue';
import SupportRequestModal from '@/components/chat/SupportRequestModal.vue';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const chatStore = useChatStore();
const authStore = useAuthStore();
const toast = useToast();

const showSupportModal = ref(false);
const typingUsers = ref([]);
const onlineUsers = ref([]);
const showChatWindow = ref(false);
const wsConnected = ref(false);

// Polling
let messagesPollingInterval = null;
let conversationsPollingInterval = null;
let unreadPollingInterval = null;

const currentConversation = computed(() => chatStore.currentConversation);
const messages = computed(() => chatStore.messages);
const loading = computed(() => chatStore.loading);
const sendingMessage = computed(() => chatStore.sendingMessage);
const canSendMessages = computed(() => chatStore.canSendMessages);
const canRequestSupport = computed(() => chatStore.canRequestSupport);
const isConversationActive = computed(() => chatStore.isConversationActive);
const currentUserId = computed(() => authStore.user?.id);

// ============================================
// SELECCIONAR CONVERSACIÓN
// ============================================
async function handleSelectConversation(conversation) {
  console.log('📂 Conversación seleccionada:', conversation.id);
  
  try {
    // Cargar detalle
    await chatStore.fetchConversation(conversation.id);
    
    // Cargar mensajes
    await chatStore.fetchMessages(conversation.id);
    
    // Marcar como leídos
    await markMessagesAsRead(conversation.id);
    
    // Intentar WebSocket
    tryConnectWebSocket(conversation.id);
    
    showChatWindow.value = true;
    setupWebSocketListeners();
    
  } catch (error) {
    console.error('Error seleccionando conversación:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la conversación',
      life: 3000,
    });
  }
}

// ============================================
// WEBSOCKET
// ============================================
function tryConnectWebSocket(conversationId) {
  // Mantener el chat actualizado aunque el endpoint WebSocket no esté disponible.
  startMessagesPolling(conversationId);

  const token = localStorage.getItem('token');
  if (!token) {
    console.log('⚠️ No hay token disponible');
    return;
  }

  try {
    chatWsService.connect(conversationId, token, currentUserId.value);
    
    chatWsService.on('connected', () => {
      console.log('✅ WebSocket del chat conectado');
      wsConnected.value = true;
      // Detener polling si el WebSocket funciona
      stopMessagesPolling();
    });
    
    chatWsService.on('disconnected', () => {
      console.log('❌ WebSocket desconectado');
      wsConnected.value = false;
      startMessagesPolling(conversationId);
    });
    
  } catch (error) {
    console.log('⚠️ WebSocket no disponible:', error.message);
    wsConnected.value = false;
  }
}

// ============================================
// POLLING
// ============================================
function startMessagesPolling(conversationId) {
  stopMessagesPolling();
  
  console.log('🔄 Iniciando polling de mensajes');
  
  messagesPollingInterval = setInterval(async () => {
    if (!conversationId || !chatStore.currentConversation) return;
    
    // Solo hacer polling si el WebSocket NO está conectado
    if (wsConnected.value) return;
    
    try {
      await chatStore.fetchMessages(conversationId, { silent: true });
    } catch (error) {
      // Silencioso
    }
  }, 5000);
}

function stopMessagesPolling() {
  if (messagesPollingInterval) {
    clearInterval(messagesPollingInterval);
    messagesPollingInterval = null;
  }
}

// ============================================
// MARCAR COMO LEÍDOS
// ============================================
async function markMessagesAsRead(conversationId) {
  try {
    const unread = chatStore.messages.filter(m => !m.is_mine && !m.is_read);
    
    for (const message of unread) {
      try {
        await chatStore.markMessageAsRead(conversationId, message.id);
      } catch (error) {
        // Silencioso
      }
    }
  } catch (error) {
    // Silencioso
  }
}

// ============================================
// LISTENERS WEBSOCKET
// ============================================
function setupWebSocketListeners() {
  chatWsService.off('new_message');
  chatWsService.off('typing');
  chatWsService.off('user_online');
  chatWsService.off('user_offline');
  chatWsService.off('support_joined');
  chatWsService.off('conversation_closed');

  chatWsService.on('new_message', (message) => {
    console.log('💬 Nuevo mensaje (WebSocket):', message);
    // Marcar como leído automáticamente si el chat está abierto
    if (currentConversation.value && !message.is_mine) {
      chatStore.markMessageAsRead(currentConversation.value.id, message.id).catch(() => {});
    }
  });

  chatWsService.on('typing', (data) => {
    const idx = typingUsers.value.findIndex(u => u.user_id === data.user_id);
    if (data.is_typing) {
      if (idx === -1) {
        typingUsers.value.push({ user_id: data.user_id, full_name: data.full_name });
      }
    } else if (idx !== -1) {
      typingUsers.value.splice(idx, 1);
    }
  });

  chatWsService.on('user_online', (data) => {
    if (!onlineUsers.value.includes(data.user_id)) {
      onlineUsers.value.push(data.user_id);
    }
  });

  chatWsService.on('user_offline', (data) => {
    const idx = onlineUsers.value.indexOf(data.user_id);
    if (idx !== -1) onlineUsers.value.splice(idx, 1);
  });

  chatWsService.on('message_read', (data) => {
    console.log('✓✓ Mensaje leído:', data);
  });

  chatWsService.on('support_joined', (data) => {
    toast.add({
      severity: 'info',
      summary: 'Soporte se ha unido',
      detail: `${data.support_user?.full_name || 'Soporte'} se ha unido a la conversación`,
      life: 5000,
    });
    if (currentConversation.value) {
      chatStore.fetchConversation(currentConversation.value.id);
    }
  });

  chatWsService.on('conversation_closed', () => {
    toast.add({
      severity: 'warn',
      summary: 'Conversación cerrada',
      detail: 'La conversación ha sido cerrada',
      life: 5000,
    });
  });
}

// ============================================
// ENVIAR MENSAJE
// ============================================
async function handleSendMessage({ content, replyTo }) {
  if (!currentConversation.value) return;
  
  try {
    // REST confirma que el backend guardó el mensaje. WebSocket solo confirma
    // que el frame salió del navegador, no que el servidor lo haya procesado.
    console.log('📤 Enviando mensaje por REST API');
    
    if (replyTo) {
      await chatStore.replyToMessage(currentConversation.value.id, replyTo.id, { content });
    } else {
      await chatStore.sendMessage(currentConversation.value.id, {
        content,
        message_type: 'text',
      });
    }
    
    // Refrescar mensajes
    await chatStore.fetchMessages(currentConversation.value.id);
    
  } catch (error) {
    const responseData = error.response?.data;
    const detail = typeof responseData === 'string'
      ? responseData
      : responseData?.detail || responseData?.message || error.message || 'No se pudo enviar el mensaje';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail,
      life: 3000,
    });
  }
}

// ============================================
// OTROS MÉTODOS
// ============================================
function handleReplyMessage(message) {
  console.log('💬 Responder a:', message.id);
}

async function handleDeleteMessage(message) {
  if (!currentConversation.value) return;
  if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;
  
  try {
    await chatStore.deleteMessage(currentConversation.value.id, message.id);
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Mensaje eliminado',
      life: 2000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo eliminar el mensaje',
      life: 3000,
    });
  }
}

async function handleRequestSupport(supportData) {
  if (!currentConversation.value) return;
  
  try {
    await chatStore.requestSupport(currentConversation.value.id, supportData);
    showSupportModal.value = false;
    toast.add({
      severity: 'success',
      summary: 'Soporte solicitado',
      detail: 'Un administrador se unirá a la conversación pronto',
      life: 5000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo solicitar soporte',
      life: 3000,
    });
  }
}

async function handleCloseConversation() {
  if (!currentConversation.value) return;
  if (!confirm('¿Estás seguro de cerrar esta conversación?')) return;
  
  try {
    await chatStore.closeConversation(currentConversation.value.id, 'Cerrado por el restaurante');
    toast.add({
      severity: 'success',
      summary: 'Conversación cerrada',
      detail: 'La conversación ha sido cerrada',
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'No se pudo cerrar la conversación',
      life: 3000,
    });
  }
}

function handleTyping(isTyping) {
  if (wsConnected.value) {
    chatWsService.sendTyping(isTyping);
  }
}

function toggleParticipants() {}

// ============================================
// LIFECYCLE
// ============================================
onMounted(async () => {
  console.log('💬 ChatView montado');
  
  if (typeof window !== 'undefined') {
    window.chatStore = chatStore;
  }
  
  await chatStore.fetchConversations();
  
  // Polling de conversaciones
  conversationsPollingInterval = setInterval(async () => {
    try {
      await chatStore.fetchConversations();
    } catch (error) {
      // Silencioso
    }
  }, 15000);
  
  // Polling de no leídos
  unreadPollingInterval = setInterval(async () => {
    try {
      await chatStore.fetchTotalUnread();
    } catch (error) {
      // Silencioso
    }
  }, 30000);
  
  // Cargar por order_id
  if (route.query.order_id) {
    try {
      console.log(`📂 Cargando por order_id: ${route.query.order_id}`);
      const conversation = await chatStore.fetchConversationByOrder(route.query.order_id);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    } catch (error) {
      console.error('Error cargando conversación por pedido:', error);
    }
  }
  
  // Cargar por conversation_id
  if (route.query.conversation_id) {
    try {
      console.log(`📂 Cargando por conversation_id: ${route.query.conversation_id}`);
      await chatStore.fetchConversation(route.query.conversation_id);
      await chatStore.fetchMessages(route.query.conversation_id);
      tryConnectWebSocket(route.query.conversation_id);
      showChatWindow.value = true;
      setupWebSocketListeners();
    } catch (error) {
      console.error('Error cargando conversación:', error);
    }
  }
});

onUnmounted(() => {
  console.log('💬 ChatView desmontado');
  stopMessagesPolling();
  
  if (conversationsPollingInterval) clearInterval(conversationsPollingInterval);
  if (unreadPollingInterval) clearInterval(unreadPollingInterval);
  
  chatWsService.disconnect();
});
</script>

<style scoped>
.chat-view {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 1rem;
  height: calc(100vh - 140px);
  padding: 1rem;
}

.chat-sidebar-container,
.chat-window-container {
  height: 100%;
  overflow: hidden;
}

.no-conversation {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: white;
  border-radius: 12px;
  color: #6b7280;
  text-align: center;
  padding: 2rem;
}

.no-conversation i {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.no-conversation h3 {
  font-size: 1.1rem;
  color: #1a1a2e;
  margin: 0 0 0.5rem;
}

.no-conversation p {
  font-size: 0.9rem;
  margin: 0;
}

@media (max-width: 900px) {
  .chat-view {
    grid-template-columns: 1fr;
  }
  
  .hidden-mobile {
    display: none;
  }
}
</style>
