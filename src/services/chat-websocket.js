import { useChatStore } from '@/stores/chat';

class ChatWebSocketService {
  constructor() {
    this.ws = null;
    this.conversationId = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.heartbeatInterval = null;
    this.isConnecting = false;
    this.shouldReconnect = true;
    this.lastPong = null;
    this.token = null;
    this.userId = null;
  }

  /**
   * Conectar al WebSocket del chat
   * URL: wss://sabi-x-delivery.duckdns.org/ws/chat/{conversation_id}/?token={jwt}
   */
  connect(conversationId, token, userId = null) {
    // Si ya está conectado a esta conversación, no hacer nada
    if (this.ws?.readyState === WebSocket.OPEN && this.conversationId === conversationId) {
      console.log('⚠️ Ya conectado a esta conversación');
      return;
    }

    // Desconectar de la conversación anterior
    if (this.conversationId && this.conversationId !== conversationId) {
      this.disconnect();
    }

    this.conversationId = conversationId;
    this.token = token;
    this.userId = userId;
    this.isConnecting = true;
    this.shouldReconnect = true;
    
    // 🔥 URL correcta con token en query string
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://sabi-x-delivery.duckdns.org';
    const url = `${wsUrl}/ws/chat/${conversationId}/?token=${token}`;
    
    // La URL incluye el JWT en el query string; no imprimirla en consola.
    console.log(`🔗 Conectando al chat WebSocket de la conversación ${conversationId}`);
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log(`✅ Chat WebSocket conectado a conversación ${conversationId}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastPong = Date.now();
        
        // 🔥 Iniciar heartbeat (ping cada 15 segundos)
        this.startHeartbeat();
        
        this.emit('connected', { conversationId });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 🔥 Manejar pong del heartbeat
          if (data.type === 'pong') {
            this.lastPong = Date.now();
            return;
          }
          
          console.log('📩 Evento del chat:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing chat WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('❌ Chat WebSocket desconectado:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // 🔥 Reconectar solo si no fue cierre manual (código 1000)
        if (event.code !== 1000 && this.shouldReconnect) {
          this.handleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ Chat WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Error creating chat WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  /**
   * Manejar mensajes del WebSocket
   */
  handleMessage(data) {
    const chatStore = useChatStore();
    
    // El backend envía eventos con type o event
    const eventType = data.event || data.type;
    const eventData = data.data || data.message || data;

    switch (eventType) {
      case 'new_message':
        console.log('💬 Nuevo mensaje:', eventData);
        chatStore.addMessageFromSocket(eventData);
        this.emit('new_message', eventData);
        break;

      case 'typing':
        this.emit('typing', eventData);
        break;

      case 'user_online':
        this.emit('user_online', eventData);
        break;

      case 'user_offline':
        this.emit('user_offline', eventData);
        break;

      case 'message_read':
        this.emit('message_read', eventData);
        break;

      case 'message_deleted':
        this.emit('message_deleted', eventData);
        break;

      case 'unread_count':
        if (eventData.conversation_id) {
          chatStore.updateUnreadCount(eventData.conversation_id, eventData.count);
        }
        this.emit('unread_count', eventData);
        break;

      case 'support_joined':
        this.emit('support_joined', eventData);
        break;

      case 'support_resolved':
        this.emit('support_resolved', eventData);
        break;

      case 'conversation_closed':
        this.emit('conversation_closed', eventData);
        break;

      default:
        console.log('📩 Evento no manejado:', eventType, eventData);
        this.emit('unknown', { type: eventType, data: eventData });
    }
  }

  /**
   * 🔥 HEARTBEAT: Enviar ping cada 15 segundos
   */
  startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ action: 'ping' }));
          console.log('💓 Ping enviado');
        } catch (error) {
          console.warn('Error enviando ping:', error);
        }
      }
    }, 15000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Reconectar con backoff exponencial
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Máximo de reintentos alcanzado para el chat');
      this.emit('max_reconnect_attempts');
      return;
    }
    
    if (!this.shouldReconnect) {
      return;
    }

    this.reconnectAttempts++;
    
    // 🔥 Backoff exponencial: 2s, 4s, 8s, 16s, 30s, 30s...
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 Reintentando conexión al chat en ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect && this.conversationId && this.token) {
        this.connect(this.conversationId, this.token, this.userId);
      }
    }, delay);
  }

  /**
   * Enviar mensaje por WebSocket
   */
  sendMessage(content, messageType = 'text') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'send_message',
        content,
        message_type: messageType,
      }));
      return true;
    }
    return false;
  }

  /**
   * Indicar que el usuario está escribiendo
   */
  sendTyping(isTyping = true) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'typing',
        is_typing: isTyping,
      }));
    }
  }

  /**
   * Marcar mensaje como leído
   */
  sendMarkAsRead(messageId) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'mark_read',
        message_id: messageId,
      }));
    }
  }

  /**
   * Desconectar (cierre manual)
   */
  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    
    if (this.ws) {
      try {
        this.ws.close(1000, 'Cierre manual');
      } catch (error) {
        console.warn('Error cerrando WebSocket:', error);
      }
      this.ws = null;
    }
    
    this.conversationId = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Sistema de eventos
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get currentConversationId() {
    return this.conversationId;
  }
}

// Singleton
const chatWsService = new ChatWebSocketService();

if (typeof window !== 'undefined') {
  window.chatWsService = chatWsService;
  console.log('🔍 chatWsService disponible en consola como: window.chatWsService');
}

export default chatWsService;
