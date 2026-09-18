// Service Worker para Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 🔥 TU CONFIGURACIÓN DE FIREBASE (misma que en el frontend)
const firebaseConfig = {
  apiKey: "AIzaSyBOcr3mc_pO2GTpE9v-XxbozT56aqEhtiM",
  authDomain: "sabixdelivery.firebaseapp.com",
  projectId: "sabixdelivery",
  storageBucket: "sabixdelivery.firebasestorage.app",
  messagingSenderId: "1097443656390",
  appId: "1:1097443656390:web:69bbcbfff3c10e1dd08dc7",
  vapidKey: "BH_PvyS0_ex0etKAcAbGOh77V9CadWf_4utk2fXQNXQZVSrKa8GinTww2weuzuhGsC_fgulWc8zbxsGlNhYeSXE",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Obtener instancia de Messaging
const messaging = firebase.messaging();

// Manejar mensajes en background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en background:', payload);

  const { notification, data } = payload;
  
  const notificationTitle = notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: notification?.body || '',
    icon: notification?.icon || '/logo.svg',
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

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  const { notification, data } = event;

  event.notification.close();

  const type = data?.type || '';
  const orderId = data?.order_id || '';
  
  let url = '/';
  
  if (type === 'order_new' || type === 'order_confirmed' || type === 'order_ready' || type === 'order_in_delivery') {
    if (orderId) {
      url = `/orders/${orderId}`;
    } else {
      url = '/orders';
    }
  } else if (type === 'promotion') {
    url = '/promotions';
  } else {
    url = '/notifications';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});