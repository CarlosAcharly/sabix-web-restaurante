import { useNotificationsStore } from '@/stores/notifications';

class PollingService {
  constructor() {
    this.intervalId = null;
    this.intervalTime = 15000; // 15 segundos
    this.isRunning = false;
    this.userId = null;
    this.lastCheck = null;
  }

  /**
   * Iniciar polling para un usuario
   */
  start(userId) {
    if (this.isRunning) {
      console.log('⚠️ Polling ya está activo');
      return;
    }

    this.userId = userId;
    this.isRunning = true;
    console.log(`🔄 Iniciando polling para usuario ID: ${userId}`);

    // Ejecutar inmediatamente
    this.checkNotifications();

    // Configurar intervalo
    this.intervalId = setInterval(() => {
      this.checkNotifications();
    }, this.intervalTime);

    console.log('✅ Polling iniciado correctamente');
  }

  /**
   * Detener polling
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.userId = null;
    console.log('⏹️ Polling detenido');
  }

  /**
   * Verificar nuevas notificaciones
   */
  async checkNotifications() {
    if (!this.userId) return;

    try {
      const notificationsStore = useNotificationsStore();
      
      // Obtener contador actual
      const currentCount = notificationsStore.unreadCount;
      
      // Obtener nuevo contador del servidor
      await notificationsStore.fetchUnreadCount();
      const newCount = notificationsStore.unreadCount;

      // Si hay nuevas notificaciones, recargar la lista
      if (newCount > currentCount) {
        console.log(`📩 Nuevas notificaciones detectadas: ${newCount - currentCount}`);
        await notificationsStore.fetchNotifications({ 
          page: 1, 
          pageSize: 20,
          is_read: false 
        });
        
        // Emitir evento de nuevas notificaciones
        this.emit('new_notifications', {
          count: newCount,
          newCount: newCount - currentCount
        });
      }

      this.lastCheck = new Date();
    } catch (error) {
      console.error('❌ Error en polling:', error);
    }
  }

  /**
   * Cambiar intervalo de polling
   */
  setInterval(ms) {
    if (ms < 5000) {
      console.warn('⚠️ Intervalo muy corto, mínimo 5 segundos');
      return;
    }
    this.intervalTime = ms;
    
    // Reiniciar con nuevo intervalo
    if (this.isRunning) {
      this.stop();
      this.start(this.userId);
    }
  }

  /**
   * Sistema de eventos
   */
  on(event, callback) {
    if (!this.listeners) {
      this.listeners = {};
    }
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners && this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  get isActive() {
    return this.isRunning;
  }
}

// Singleton
const pollingService = new PollingService();

if (typeof window !== 'undefined') {
  window.pollingService = pollingService;
  console.log('🔍 pollingService disponible en consola como: window.pollingService');
}

export default pollingService;