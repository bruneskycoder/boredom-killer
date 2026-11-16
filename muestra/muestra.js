// Página de muestra: conecta los controles y dibuja la lámina de ejemplo.
// El dibujo del mapa es un boceto para decidir el estilo; el motor de mapas (zoom, toque, pruebas) es del paso 4.
import { crearFondo } from '../app/nucleo/fondo.js';
import { tocar, activar } from '../app/nucleo/sonido.js';

const raiz = document.documentElement;
const css = (nombre) => getComputedStyle(raiz).getPropertyValue(nombre).trim();

// Paleta: cada muestra lee su color del mismo lugar que el resto de la página
for (const caja of document.querySelectorAll('[data-colores]')) {
  for (const item of caja.dataset.colores.split('|')) {
    const [clave, nombre, uso] = item.split(':');
    const d = document.createElement('div');
    d.className = 'color';
    d.innerHTML = `<i style="background:var(--${clave})"></i><b>${nombre}</b><span>${css('--' + clave)}</span><span>${uso}</span>`;
    caja.append(d);
  }
}

// Grupos donde un solo botón queda apretado
function unoSolo(id, alElegir) {
  const grupo = document.getElementById(id);
  grupo.addEventListener('click', (e) => {
    const boton = e.target.closest('button');
    if (!boton) return;
    for (const otro of grupo.querySelectorAll('button')) otro.setAttribute('aria-pressed', otro === boton);
    alElegir?.(boton.dataset.valor);
  });
}

const fondo = crearFondo(document.getElementById('fondo'));
fondo.fijar({ tension: 0.1, tono: css('--bermellon') });
unoSolo('sel-fondo', (v) => fondo.fijar({ tension: Number(v) }));
unoSolo('sel-tono', (v) => fondo.fijar({ tono: css('--' + v) }));
unoSolo('sel-familia');
unoSolo('sel-idioma');

function describirTipos() {
  document.getElementById('tipos-ahora').textContent = raiz.dataset.tipos === 'sistema'
    ? 'las del aparato (Iowan Old Style y SF Mono en iPhone; Sitka y Cascadia en Windows)'
    : 'Literata e IBM Plex Mono, incluidas en la app';
}
unoSolo('sel-tipos', (v) => {
  if (v === 'sistema') raiz.dataset.tipos = 'sistema'; else delete raiz.dataset.tipos;
  describirTipos();
  dibujarLamina();
});
describirTipos();

addEventListener('pointerdown', activar, { once: true });
for (const boton of document.querySelectorAll('[data-sonido]')) boton.addEventListener('click', () => tocar(boton.dataset.sonido));

const lobby = document.getElementById('lobby');
lobby.addEventListener('click', (e) => {
  const tarjeta = e.target.closest('.tarjeta');
  if (!tarjeta) return;
  for (const otra of lobby.children) otra.removeAttribute('aria-current');
  tarjeta.setAttribute('aria-current', 'true');
  tocar('turno');
});

// ---------- Lámina ----------
const VENTANA = { oeste: -76, este: -51.5, norte: -20.5, sur: -56.5, paralelo: -38 };
const ROTULOS = { 'Buenos Aires': 1, 'Córdoba': 1, 'Rosario': 1, 'Mendoza': 1, 'San Miguel de Tucumán': 1, 'Salta': 1, 'Mar del Plata': 1, 'Neuquén': 1, 'Comodoro Rivadavia': 1, 'Río Gallegos': 1, 'Ushuaia': 1 };
const JUGADA = { lugar: 'Bahía Blanca', toque: [-65.6, -40.5] };
const KM_POR_GRADO = 111.195;

function distanciaKm([lon1, lat1], [lon2, lat2]) {
  const r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

let datos;
async function dibujarLamina() {
  datos ??= await Promise.all(['argentina', 'mundo'].map((n) => fetch(`../app/datos/mapa-${n}.json`).then((r) => r.json())));
  const [argentina, mundo] = datos;
  const lectura = css('--lectura'), maquina = css('--maquina');
  await Promise.all([`italic 12px ${lectura}`, `600 12px ${lectura}`, `600 12px ${maquina}`].map((f) => document.fonts.load(f)));

  const lienzo = document.getElementById('mapa');
  const V = VENTANA, coseno = Math.cos(V.paralelo * Math.PI / 180);
  const W = lienzo.parentElement.clientWidth;
  const k = W / ((V.este - V.oeste) * coseno); // px por grado de latitud
  const H = Math.round((V.norte - V.sur) * k);
  const dpr = Math.min(3, devicePixelRatio || 1);
  lienzo.width = Math.round(W * dpr);
  lienzo.height = Math.round(H * dpr);
  lienzo.style.height = H + 'px';
  const c = lienzo.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const px = (lon, lat) => [(lon - V.oeste) * coseno * k, (V.norte - lat) * k];

  const trazar = (anillos) => {
    c.beginPath();
    for (const a of anillos) {
      for (let i = 0; i < a.length; i += 2) {
        const [x, y] = px(a[i], a[i + 1]);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
    }
  };
  const enVentana = (a) => {
    for (let i = 0; i < a.length; i += 2) if (a[i] > V.oeste - 2 && a[i] < V.este + 2 && a[i + 1] > V.sur - 2 && a[i + 1] < V.norte + 2) return true;
    return false;
  };
  const conHalo = (texto, x, y, relleno, halo) => {
    c.lineJoin = 'round'; c.lineWidth = 3; c.strokeStyle = halo; c.strokeText(texto, x, y);
    c.fillStyle = relleno; c.fillText(texto, x, y);
  };
  const espaciado = (texto, x, y, aire) => { // centrado en x, con aire entre letras
    const letras = [...texto], anchos = letras.map((l) => c.measureText(l).width);
    let cx = x - (anchos.reduce((s, a) => s + a, 0) + aire * (letras.length - 1)) / 2;
    c.textAlign = 'left';
    letras.forEach((l, i) => { c.fillText(l, cx, y); cx += anchos[i] + aire; });
  };

  const tinta = css('--tinta'), suave = css('--tinta-suave'), papel = css('--papel'), claro = css('--papel-claro');
  const hondo = css('--papel-hondo'), trazo = css('--trazo'), bermellon = css('--bermellon'), negro = css('--negro');

  // Agua y países vecinos
  c.fillStyle = css('--mar'); c.fillRect(0, 0, W, H);
  for (const pais of mundo.paises) {
    const anillos = pais.anillos.filter(enVentana);
    if (!anillos.length) continue;
    trazar(anillos);
    c.fillStyle = hondo; c.fill();
    c.strokeStyle = pais.id === 'ARG' ? hondo : trazo; c.lineWidth = pais.id === 'ARG' ? 2 : 0.8; c.stroke();
  }

  // Provincias
  for (const region of argentina.regiones) {
    trazar(region.anillos);
    c.fillStyle = claro; c.fill();
    c.strokeStyle = tinta; c.globalAlpha = 0.75; c.lineWidth = 0.6; c.stroke(); c.globalAlpha = 1;
  }

  // Retícula cada 5°
  c.font = `400 9px ${maquina}`; c.textBaseline = 'top';
  for (let lon = -75; lon <= -55; lon += 5) {
    const [x] = px(lon, 0);
    c.strokeStyle = tinta; c.globalAlpha = 0.14; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
    c.globalAlpha = 0.7; c.fillStyle = suave; c.textAlign = 'left'; c.fillText(`${-lon}° O`, x + 3, 4);
  }
  for (let lat = -25; lat >= -55; lat -= 5) {
    const [, y] = px(0, lat);
    c.strokeStyle = tinta; c.globalAlpha = 0.14; c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    c.globalAlpha = 0.7; c.fillStyle = suave; c.textAlign = 'right'; c.fillText(`${-lat}° S`, W - 4, y + 3);
  }
  c.globalAlpha = 1;

  // Rótulos de agua y de vecinos
  c.textBaseline = 'middle';
  c.fillStyle = suave; c.globalAlpha = 0.8;
  c.font = `italic 400 13px ${lectura}`;
  espaciado('Mar Argentino', ...px(-59.3, -44.6), 3);
  c.font = `600 9px ${lectura}`;
  espaciado('URUGUAY', ...px(-56, -32.9), 2.5);
  espaciado('BRASIL', ...px(-53.4, -29.4), 2.5);
  espaciado('PARAGUAY', ...px(-58.2, -23.3), 2.5);
  espaciado('BOLIVIA', ...px(-63.6, -21.9), 2.5);
  c.save(); c.translate(...px(-74.6, -37)); c.rotate(-Math.PI / 2); espaciado('CHILE', 0, 0, 5); c.restore();
  c.globalAlpha = 1;

  // Ciudades
  c.font = `400 11.5px ${lectura}`;
  for (const ciudad of argentina.ciudades) {
    const lado = ROTULOS[ciudad.nombre];
    if (!lado) continue;
    const [x, y] = px(ciudad.lon, ciudad.lat);
    c.fillStyle = tinta; c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill();
    if (ciudad.nombre === 'Buenos Aires') { c.strokeStyle = tinta; c.lineWidth = 0.8; c.beginPath(); c.arc(x, y, 4.2, 0, 7); c.stroke(); }
    c.textAlign = lado > 0 ? 'left' : 'right';
    conHalo(ciudad.nombre, x + 7 * lado, y, tinta, claro);
  }
  c.font = `italic 400 11px ${lectura}`; c.textAlign = 'left';
  conHalo('Islas Malvinas', ...px(-61.6, -53.2), suave, css('--mar'));

  // Escala de 500 km
  const largo = 500 / KM_POR_GRADO * k, ex = 12, ey = H - 16;
  c.fillStyle = tinta; c.fillRect(ex, ey, largo / 2, 4);
  c.strokeStyle = tinta; c.lineWidth = 1; c.strokeRect(ex + 0.5, ey + 0.5, largo - 1, 3);
  c.font = `400 9px ${maquina}`; c.textBaseline = 'bottom'; c.textAlign = 'left';
  c.fillText('0', ex, ey - 3); c.textAlign = 'center'; c.fillText('250', ex + largo / 2, ey - 3); c.textAlign = 'right'; c.fillText('500 km', ex + largo + 16, ey - 3);

  // La jugada: tu toque, el lugar real y el error
  const real = argentina.ciudades.find((x) => x.nombre === JUGADA.lugar);
  const [tx, ty] = px(...JUGADA.toque), [rx, ry] = px(real.lon, real.lat);
  c.strokeStyle = bermellon; c.lineWidth = 1.5; c.setLineDash([5, 4]);
  c.beginPath(); c.moveTo(tx, ty); c.lineTo(rx, ry); c.stroke(); c.setLineDash([]);
  c.lineWidth = 2; c.beginPath(); c.arc(tx, ty, 8, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(tx - 13, ty); c.lineTo(tx - 4, ty); c.moveTo(tx + 4, ty); c.lineTo(tx + 13, ty); c.moveTo(tx, ty - 13); c.lineTo(tx, ty - 4); c.moveTo(tx, ty + 4); c.lineTo(tx, ty + 13); c.stroke();
  c.fillStyle = tinta; c.beginPath(); c.arc(rx, ry, 3.2, 0, 7); c.fill();
  c.strokeStyle = bermellon; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, 6.5, 0, 7); c.stroke();
  c.font = `600 12.5px ${lectura}`; c.textAlign = 'left'; c.textBaseline = 'middle';
  conHalo(real.nombre, rx + 11, ry - 1, tinta, claro);
  const km = Math.round(distanciaKm(JUGADA.toque, [real.lon, real.lat])) + ' KM';
  c.font = `600 11px ${maquina}`;
  const ancho = c.measureText(km).width + 14, mx = tx - ancho / 2, my = ty + 19;
  c.fillStyle = negro; c.fillRect(mx, my, ancho, 20);
  c.fillStyle = papel; c.textAlign = 'center'; c.fillText(km, mx + ancho / 2, my + 10.5);
}

dibujarLamina();
let espera;
addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(dibujarLamina, 150); });
