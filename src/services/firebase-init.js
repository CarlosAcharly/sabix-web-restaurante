// Importar los módulos de Firebase
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// 🔥 TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBOcr3mc_pO2GTpE9v-XxbozT56aqEhtiM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sabixdelivery.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sabixdelivery",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sabixdelivery.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1097443656390",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1097443656390:web:69bbcbfff3c10e1dd08dc7",
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "BH_PvyS0_ex0etKAcAbGOh77V9CadWf_4utk2fXQNXQZVSrKa8GinTww2weuzuhGsC_fgulWc8zbxsGlNhYeSXE",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Obtener instancia de Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.warn('⚠️ Error al obtener Messaging:', error);
}

// Servicio de notificaciones push
class PushNotificationService {
  constructor() {
    this.messaging = messaging;
    this.token = null;
    this._isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    console.log('🔧 PushNotificationService inicializado. Soporte:', this._isSupported);
  }

  /**
   * Verificar si el navegador soporta notificaciones push
   */
  isSupported() {
    return this._isSupported;
  }

  /**
   * Solicitar permiso para notificaciones
   */
  async requestPermission() {
    if (!this._isSupported) {
      console.warn('⚠️ Notificaciones no soportadas en este navegador');
      return { granted: false, reason: 'not_supported' };
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Permiso de notificaciones concedido');
        return { granted: true };
      } else if (permission === 'denied') {
        console.warn('❌ Permiso de notificaciones denegado');
        return { granted: false, reason: 'denied' };
      } else {
        console.warn('⏳ Permiso de notificaciones en estado: default');
        return { granted: false, reason: 'default' };
      }
    } catch (error) {
      console.error('❌ Error al solicitar permiso:', error);
      return { granted: false, reason: 'error', error };
    }
  }

  /**
   * Obtener token FCM
   */
  async getFCMToken() {
    if (!this._isSupported) {
      console.warn('⚠️ Notificaciones no soportadas');
      return null;
    }

    if (!this.messaging) {
      console.warn('⚠️ Firebase Messaging no disponible');
      return null;
    }

    try {
      if (Notification.permission !== 'granted') {
        console.warn('⚠️ No hay permiso para notificaciones');
        return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: firebaseConfig.vapidKey,
      });

      if (token) {
        this.token = token;
        console.log('✅ Token FCM obtenido:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.warn('⚠️ No se pudo obtener el token FCM');
        return null;
      }
    } catch (error) {
      console.error('❌ Error al obtener token FCM:', error);
      return null;
    }
  }

  /**
   * Escuchar mensajes en primer plano
   */
  onMessage(callback) {
    if (!this._isSupported || !this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('📩 Mensaje FCM recibido en primer plano:', payload);
      
      if (callback) {
        callback(payload);
      }
      
      this.showBrowserNotification(payload);
    });
  }

  /**
   * Mostrar notificación del navegador
   */
  showBrowserNotification(payload) {
    const { notification, data } = payload;
    
    if (!notification) return;

    const options = {
      body: notification.body || '',
      icon: notification.icon || '/logo.svg',
      badge: '/badge.png',
      tag: data?.order_id || data?.type || 'notification',
      requireInteraction: true,
      data: payload.data || {},
      actions: [
        {
          action: 'view',
          title: 'Ver'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification(notification.title || 'Nueva notificación', options);
      
      notif.onclick = (event) => {
        event.preventDefault();
        const data = event.target?.data || {};
        this.handleNotificationClick(data);
        notif.close();
      };
    }
  }

  /**
   * Manejar clic en notificación
   */
  handleNotificationClick(data) {
    const type = data?.type || '';
    const orderId = data?.order_id || '';
    
    if (type === 'order_new' || type === 'order_confirmed' || type === 'order_ready' || type === 'order_in_delivery') {
      if (orderId) {
        window.location.href = `/orders/${orderId}`;
      } else {
        window.location.href = '/orders';
      }
    } else if (type === 'promotion') {
      window.location.href = '/promotions';
    } else {
      window.location.href = '/notifications';
    }
  }
}

// Crear instancia del servicio
const pushService = new PushNotificationService();

// Exponer para debugging
if (typeof window !== 'undefined') {
  window.pushService = pushService;
  console.log('🔍 pushService disponible en consola como: window.pushService');
}

export default pushService;