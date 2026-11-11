# PWA de Sabix Delivery

## Generar iconos

1. Coloca el logo oficial cuadrado de 1024 x 1024 px en `public/logo-source.png`. Si no existe, el generador crea uno provisional.
2. Ejecuta `pnpm install` para instalar las dependencias.
3. Ejecuta `pnpm generate-icons` para crear los iconos en `public/icons/`.
4. Ejecuta `pnpm build` para generar la aplicación y sus archivos PWA.

El archivo provisional debe reemplazarse por el logo oficial antes de publicar.

## Verificar la PWA

Ejecuta `pnpm preview` y abre la URL que muestra Vite en Chrome. En DevTools, revisa **Application > Manifest** para verificar los metadatos e iconos y **Application > Service Workers** para confirmar que el worker aparece activo. La salida de producción incluye `dist/manifest.webmanifest`, `dist/sw.js` y `dist/workbox-*.js`.

Para probar instalación, abre la aplicación servida por HTTPS (o localhost) en Chrome y utiliza el icono **Instalar** de la barra de direcciones. El banner de la aplicación aparece cuando Chrome emite `beforeinstallprompt`; puede que no aparezca si la app ya está instalada o no cumple los criterios de instalación.

El worker PWA importa `public/firebase-messaging-sw.js` para mantener sus manejadores de notificaciones. Ambos scripts no pueden registrarse como workers independientes bajo el mismo scope `/`; el worker generado combina el caché PWA con el manejo de Firebase.
