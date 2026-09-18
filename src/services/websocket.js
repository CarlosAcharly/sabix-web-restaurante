import { useNotificationsStore } from '@/stores/notifications';
import axios from 'axios';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.isConnecting = false;
    this.listeners = {};
    this.userId = null;
    this.userType = null;
  }

  connect(userId, token, userType = 'restaurant') {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.log('ℹ️ WebSocket ya está conectado o en proceso de conexión');
      return;
    }

    this.userId = userId;
    this.userType = userType;
    this.isConnecting = true;
    
    // ✅ CORRECCIÓN CRÍTICA: Usar el dominio del backend, NO localhost
    // Usar la variable de entorno o el dominio por defecto
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://sabi-x-delivery.duckdns.org';
    // Eliminar /api/v1 si existe en la URL
    const baseUrl = wsUrl.replace('/api/v1', '').replace('/api', '');
    const url = `${baseUrl}/ws/notifications/${userId}/?token=${token}`;
    
    console.log(`🔗 Conectando WebSocket: ${url}`);
    console.log(`📌 Tipo de usuario: ${userType}`);
    
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log(`✅ WebSocket de ${this.userType} conectado`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 Mensaje WS recibido:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log(`❌ WebSocket desconectado: ${event.code} - ${event.reason || 'Sin razón'}`);
        this.isConnecting = false;
        this.handleReconnect(userId, token, userType);
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect(userId, token, userType);
    }
  }

  async handleReconnect(userId, token, userType) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      // ✅ Intentar obtener un token fresco si es posible
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || '/api/v1'}/users/token/refresh/`,
            { refresh: refreshToken }
          );
          if (response.data.access) {
            token = response.data.access;
            localStorage.setItem('token', token);
            console.log('✅ Token refrescado correctamente');
          }
        }
      } catch (error) {
        console.warn('⚠️ No se pudo refrescar el token:', error.message);
      }
      
      setTimeout(() => {
        this.connect(userId, token, userType);
      }, delay);
    } else {
      console.log('❌ Máximo de reintentos alcanzado');
      this.emit('max_reconnect_attempts');
    }
  }

  handleMessage(data) {
    const notificationsStore = useNotificationsStore();
    
    console.log('📩 Procesando evento:', data.type);

    switch (data.type) {
      case 'notification':
      case 'notification_message':
        const notification = data.data;
        console.log('🔔 NOTIFICACIÓN RECIBIDA:', notification);
        notificationsStore.addNotification(notification);
        this.emit('notification', notification);
        break;

      case 'order_new':
        const orderData = data.data;
        console.log('📦 Nuevo pedido:', orderData);
        notificationsStore.addNotification({
          id: `order_${orderData.order_id || Date.now()}`,
          title: '📦 Nuevo pedido',
          message: `Pedido #${orderData.order_id} de ${orderData.client_name || 'cliente'}`,
          type: 'order_new',
          data: orderData,
          is_read: false,
          created_at: new Date().toISOString(),
        });
        this.emit('new_order', orderData);
        break;

      case 'order_cancelled':
        console.log('❌ Pedido cancelado:', data.data);
        this.emit('order_cancelled', data.data);
        break;

      case 'order_confirmed':
        console.log('✅ Pedido confirmado:', data.data);
        this.emit('order_confirmed', data.data);
        break;

      case 'delivery:new_assignment':
        console.log('🛵 Repartidor asignado:', data.data);
        this.emit('delivery_assigned', data.data);
        break;

      case 'delivery:assignment_accepted':
        console.log('✅ Repartidor aceptó:', data.data);
        this.emit('delivery_accepted', data.data);
        break;

      case 'delivery:assignment_delivered':
        console.log('📦 Pedido entregado:', data.data);
        this.emit('delivery_delivered', data.data);
        break;

      case 'unread_count':
      case 'notification_count_update':
        console.log('📊 Contador actualizado:', data.count);
        notificationsStore.unreadCount = data.count;
        this.emit('unread_count_update', data.count);
        break;

      default:
        console.log('📩 Evento no manejado:', data.type, data);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  }

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
}

// Singleton
const wsService = new WebSocketService();

if (typeof window !== 'undefined') {
  window.wsService = wsService;
  console.log('🔍 wsService disponible en consola como: window.wsService');
}

export default wsService;