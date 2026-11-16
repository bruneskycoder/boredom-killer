// Uso offline: al instalarse guarda todos los archivos de la app; después responde desde ahí.
// La versión y la lista las escribe herramientas/generar_sw.py (la versión es un hash del contenido:
// cualquier cambio en la app cambia este archivo y el navegador baja la versión nueva).
// No editar entre las marcas a mano.

// <generado>
const VERSION = 'bk-5656b5979e';
const ARCHIVOS = [
  './',
  './datos/ingles.json',
  './datos/mapa-argentina.json',
  './datos/mapa-mundo.json',
  './datos/mapa-nueva-zelanda.json',
  './datos/palabras5.json',
  './estilos/app.css',
  './estilos/base.css',
  './estilos/fuentes/OFL-IBMPlexMono.txt',
  './estilos/fuentes/OFL-Literata.txt',
  './estilos/fuentes/literata-latin-cursiva.woff2',
  './estilos/fuentes/literata-latin.woff2',
  './estilos/fuentes/plexmono-latin-400.woff2',
  './estilos/fuentes/plexmono-latin-600.woff2',
  './iconos/apple-touch-icon.png',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './index.html',
  './manifest.json',
  './modos/donde-queda/geo.js',
  './modos/donde-queda/index.js',
  './modos/donde-queda/textos.js',
  './modos/ingles/index.js',
  './modos/ingles/logica.js',
  './modos/ingles/textos.js',
  './modos/palabra/index.js',
  './modos/palabra/logica.js',
  './modos/palabra/textos.js',
  './modos/pendiente.js',
  './modos/registro.js',
  './modos/silueta/index.js',
  './modos/silueta/logica.js',
  './modos/silueta/textos.js',
  './nucleo/app.js',
  './nucleo/dom.js',
  './nucleo/elegir.js',
  './nucleo/fondo.js',
  './nucleo/guardado.js',
  './nucleo/i18n.js',
  './nucleo/instalar.js',
  './nucleo/sonido.js',
  './nucleo/textos-app.js',
  './nucleo/vistas.js',
  './nucleo/voz.js',
];
// </generado>

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const pedido = e.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(pedido, { ignoreSearch: true }).then((guardado) => guardado || fetch(pedido).catch(() =>
      pedido.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
  );
});
