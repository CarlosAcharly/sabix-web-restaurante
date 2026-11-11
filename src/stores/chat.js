import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useChatStore = defineStore('chat', () => {
  // ============================================
  // ESTADO
  // ============================================
  const conversations = ref([]);
  const currentConversation = ref(null);
  const messages = ref([]);
  const loading = ref(false);
  const sendingMessage = ref(false);
  const error = ref(null);
  const totalUnread = ref(0);
  
  const pagination = ref({
    count: 0,
    next: null,
    previous: null,
    page: 1,
    pageSize: 50,
  });

  // ============================================
  // GETTERS
  // ============================================
  const activeConversations = computed(() => 
    conversations.value.filter(c => c.is_active)
  );

  const conversationsWithSupport = computed(() => 
    conversations.value.filter(c => c.is_support_requested)
  );

  const currentMessages = computed(() => messages.value);

  // 🔥 Getters con fallback (el backend puede no enviar can_send_messages)
  const canSendMessages = computed(() => {
    if (!currentConversation.value) return false;
    
    const conv = currentConversation.value;
    
    // Si el backend explícitamente dice false, respetar
    if (conv.can_send_messages === false) return false;
    
    // Si la conversación está cerrada, no permitir
    if (conv.is_active === false) return false;
    
    // Fallback: si hay conversación activa, permitir
    return true;
  });

  const canRequestSupport = computed(() => {
    if (!currentConversation.value) return false;
    
    const conv = currentConversation.value;
    
    if (conv.can_request_support === false) return false;
    if (conv.is_support_requested === true) return false;
    if (conv.is_active === false) return false;
    
    return true;
  });

  const isConversationActive = computed(() => {
    if (!currentConversation.value) return false;
    return currentConversation.value.is_active !== false;
  });

  // ============================================
  // ACCIONES - CONVERSACIONES
  // ============================================
  async function fetchConversations(params = {}) {
    loading.value = true;
    error.value = null;
    
    try {
      const queryParams = {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        ...params,
      };
      
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });
      
      const response = await api.get('/chat/conversations/', { params: queryParams });
      
      conversations.value = response.data.results || response.data || [];
      totalUnread.value = response.data.unread_total || 0;
      
      if (response.data.count !== undefined) {
        pagination.value = {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: params.page || 1,
          pageSize: params.pageSize || 20,
        };
      }
      
      return conversations.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar conversaciones';
      console.error('Error fetching conversations:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchConversation(id) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/chat/conversations/${id}/`);
      currentConversation.value = response.data;
      return currentConversation.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar conversación';
      console.error('Error fetching conversation:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchConversationByOrder(orderId) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/chat/conversations/by-order/${orderId}/`);
      currentConversation.value = response.data;
      return currentConversation.value;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cargar conversación del pedido';
      console.error('Error fetching conversation by order:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACCIONES - MENSAJES
  // ============================================
  async function fetchMessages(conversationId, params = {}) {
    const silent = params.silent === true;
    const { silent: _silent, pageSize, ...requestParams } = params;
    if (!silent) {
      loading.value = true;
      error.value = null;
    }
    
    try {
      const currentPageSize = pageSize || 50;
      const queryParams = {
        page: requestParams.page || 1,
        page_size: currentPageSize,
        ordering: requestParams.ordering || '-created_at',
        ...requestParams,
      };
      
      const messagesUrl = `/chat/conversations/${conversationId}/messages/`;
      let response = await api.get(messagesUrl, {
        params: queryParams
      });
      
      let fetchedMessages = response.data.results || response.data || [];
      let currentPage = queryParams.page;
      const firstCreatedAt = Date.parse(fetchedMessages[0]?.created_at);
      const lastCreatedAt = Date.parse(fetchedMessages.at(-1)?.created_at);
      const resultsAreAscending =
        Number.isFinite(firstCreatedAt) &&
        Number.isFinite(lastCreatedAt) &&
        firstCreatedAt <= lastCreatedAt;

      // Some API configurations ignore `ordering`; when so, load the last
      // page if the response is oldest-first.
      if (
        !requestParams.page &&
        resultsAreAscending &&
        response.data.count > fetchedMessages.length
      ) {
        currentPage = Math.ceil(response.data.count / currentPageSize);
        response = await api.get(messagesUrl, {
          params: { ...queryParams, page: currentPage },
        });
        fetchedMessages = response.data.results || response.data || [];
      }

      messages.value = [...fetchedMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      if (response.data.count !== undefined) {
        pagination.value = {
          count: response.data.count,
          next: response.data.next,
          previous: response.data.previous,
          page: currentPage,
          pageSize: currentPageSize,
        };
      }
      
      return messages.value;
    } catch (err) {
      if (!silent) {
        error.value = err.response?.data?.message || 'Error al cargar mensajes';
      }
      console.error('Error fetching messages:', err);
      throw err;
    } finally {
      if (!silent) loading.value = false;
    }
  }

  async function sendMessage(conversationId, messageData) {
    sendingMessage.value = true;
    error.value = null;
    
    try {
      const payload = {
        content: messageData.content,
        message_type: messageData.message_type || 'text',
        metadata: messageData.metadata || {},
      };
      
      const response = await api.post(
        `/chat/conversations/${conversationId}/messages/send/`,
        payload
      );
      
      // Agregar el mensaje a la lista
      messages.value.push(response.data);
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al enviar mensaje';
      console.error('Error sending message:', err);
      throw err;
    } finally {
      sendingMessage.value = false;
    }
  }

  async function replyToMessage(conversationId, messageId, messageData) {
    sendingMessage.value = true;
    error.value = null;
    
    try {
      const response = await api.post(
        `/chat/conversations/${conversationId}/messages/${messageId}/reply/`,
        {
          content: messageData.content,
          message_type: messageData.message_type || 'text',
        }
      );
      
      messages.value.push(response.data);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al responder mensaje';
      console.error('Error replying to message:', err);
      throw err;
    } finally {
      sendingMessage.value = false;
    }
  }

  async function markMessageAsRead(conversationId, messageId) {
    try {
      await api.post(`/chat/conversations/${conversationId}/messages/${messageId}/read/`);
      
      const index = messages.value.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages.value[index].is_read = true;
      }
      
      return true;
    } catch (err) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  }

  async function deleteMessage(conversationId, messageId) {
    try {
      await api.delete(`/chat/conversations/${conversationId}/messages/${messageId}/`);
      
      const index = messages.value.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages.value[index].is_deleted = true;
        messages.value[index].content = 'Mensaje eliminado';
      }
      
      return true;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al eliminar mensaje';
      console.error('Error deleting message:', err);
      throw err;
    }
  }

  // ============================================
  // ACCIONES - NO LEÍDOS
  // ============================================
  async function fetchUnreadCount(conversationId) {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/unread/`);
      return response.data;
    } catch (err) {
      console.error('Error fetching unread count:', err);
      throw err;
    }
  }

  async function fetchTotalUnread() {
    try {
      const response = await api.get('/chat/unread/total/');
      totalUnread.value = response.data.total_unread || 0;
      return response.data;
    } catch (err) {
      console.error('Error fetching total unread:', err);
      return { total_unread: 0 };
    }
  }

  // ============================================
  // ACCIONES - SOPORTE
  // ============================================
  async function requestSupport(conversationId, supportData) {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post(
        `/chat/conversations/${conversationId}/request-support/`,
        {
          reason: supportData.reason,
          priority: supportData.priority || 'medium',
        }
      );
      
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value.is_support_requested = true;
        currentConversation.value.can_request_support = false;
      }
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al solicitar soporte';
      console.error('Error requesting support:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACCIONES - CERRAR CONVERSACIÓN
  // ============================================
  async function closeConversation(conversationId, reason = '') {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await api.post(
        `/chat/conversations/${conversationId}/close/`,
        { reason }
      );
      
      if (currentConversation.value?.id === conversationId) {
        currentConversation.value.is_active = false;
        currentConversation.value.can_send_messages = false;
        currentConversation.value.can_close = false;
      }
      
      const index = conversations.value.findIndex(c => c.id === conversationId);
      if (index !== -1) {
        conversations.value[index].is_active = false;
      }
      
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || 'Error al cerrar conversación';
      console.error('Error closing conversation:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // ACCIONES LOCALES
  // ============================================
  function addMessageFromSocket(message) {
    const exists = messages.value.some(m => m.id === message.id);
    if (!exists) {
      messages.value.push(message);
      console.log('✅ Mensaje agregado desde WebSocket');
    }
  }

  function updateUnreadCount(conversationId, count) {
    const index = conversations.value.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      conversations.value[index].unread_count = count;
    }
  }

  function resetCurrentConversation() {
    currentConversation.value = null;
    messages.value = [];
  }

  function clearError() {
    error.value = null;
  }

  return {
    // Estado
    conversations,
    currentConversation,
    messages,
    loading,
    sendingMessage,
    error,
    totalUnread,
    pagination,
    
    // Getters
    activeConversations,
    conversationsWithSupport,
    currentMessages,
    canSendMessages,
    canRequestSupport,
    isConversationActive,
    
    // Acciones - Conversaciones
    fetchConversations,
    fetchConversation,
    fetchConversationByOrder,
    
    // Acciones - Mensajes
    fetchMessages,
    sendMessage,
    replyToMessage,
    markMessageAsRead,
    deleteMessage,
    
    // Acciones - No leídos
    fetchUnreadCount,
    fetchTotalUnread,
    
    // Acciones - Soporte
    requestSupport,
    
    // Acciones - Cerrar
    closeConversation,
    
    // Acciones locales
    addMessageFromSocket,
    updateUnreadCount,
    resetCurrentConversation,
    clearError,
  };
});
