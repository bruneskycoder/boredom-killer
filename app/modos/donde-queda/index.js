// Dónde queda: mapa mudo. Una ronda son 10 lugares; se toca dónde queda y el puntaje sale de los kilómetros de error.
import { textos } from './textos.js';
import { el } from '../../nucleo/dom.js';
import { distanciaKm, puntaje, cajaDe, proyeccion, proyectar, desproyectar, aPantalla, dePantalla, encuadre, zoomEn, mover, elegir } from './geo.js';

const RONDA = 10;
const LAMINAS = [
  { id: 'mundo', archivo: 'mapa-mundo.json', capa: 'paises', escala: 2000, num: 'I', caja: { lonMin: -180, lonMax: 180, latMin: -58, latMax: 84 } },
  { id: 'argentina', archivo: 'mapa-argentina.json', capa: 'regiones', escala: 600, num: 'II' },
  { id: 'nueva-zelanda', archivo: 'mapa-nueva-zelanda.json', capa: 'regiones', escala: 250, num: 'III' },
];
const cache = new Map();
let limpiar = () => {};

async function cargar(lam) {
  if (cache.has(lam.id)) return cache.get(lam.id);
  const r = await fetch(new URL(`../../datos/${lam.archivo}`, import.meta.url));
  if (!r.ok) throw new Error(`${lam.archivo}: ${r.status}`);
  const d = await r.json();
  const zonas = d[lam.capa];
  const caja = lam.caja || cajaDe(zonas.flatMap((z) => z.anillos));
  const P = proyeccion(caja);
  // Se proyecta una sola vez; dibujar es solo escalar y desplazar.
  const anillos = zonas.flatMap((z) => z.anillos).map((a) => {
    const f = new Float32Array(a.length);
    for (let i = 0; i < a.length; i += 2) [f[i], f[i + 1]] = proyectar(a[i], a[i + 1], P);
    return f;
  });
  const paises = Object.fromEntries((d.paises || []).map((p) => [p.id, p.nombre]));
  const datos = { ciudades: d.ciudades, anillos, caja, P, paises };
  cache.set(lam.id, datos);
  return datos;
}

function montar(contenedor, ctx) {
  let vivo = true;
  limpiar = () => { vivo = false; };
  portada(contenedor, ctx, () => vivo);
}

function portada(contenedor, ctx, sigue) {
  const { t, guardado } = ctx;
  const fmt = (n) => n.toLocaleString(ctx.idioma === 'en' ? 'en' : 'es-AR');
  const historial = guardado.historial();
  const previa = guardado.leer();
  const lamPrevia = previa && LAMINAS.find((l) => l.id === previa.lamina);
  const mejor = (id) => Math.max(0, ...historial.filter((h) => h.lamina === id).map((h) => h.puntos));

  ctx.fondo.fijar({ tension: 0.1 });
  contenedor.replaceChildren(
    el('p', { class: 'nota' }, t('ayuda')),
    lamPrevia && Array.isArray(previa.ids) ? el('button', { type: 'button', class: 'boton', onclick: () => empezar(contenedor, ctx, sigue, lamPrevia, previa) },
      t('retomar', { mapa: t(`lamina.${lamPrevia.id}`), n: previa.res.length + 1, total: RONDA })) : null,
    el('p', { class: 'etiqueta' }, t('elegir')),
    el('div', { class: 'grilla' }, LAMINAS.map((l) =>
      el('button', { type: 'button', class: 'tarjeta', onclick: () => empezar(contenedor, ctx, sigue, l) },
        el('span', { class: 'cabeza etiqueta' }, el('span', {}, t('laminaNum', { n: l.num })), el('span', {}, mejor(l.id) ? t('mejor', { n: fmt(mejor(l.id)) }) : t('sinJugar'))),
        el('h3', {}, t(`lamina.${l.id}`))))));
}

async function empezar(contenedor, ctx, sigue, lam, retomada = null) {
  let datos;
  try { datos = await cargar(lam); } catch (e) {
    console.error(e);
    if (sigue()) contenedor.replaceChildren(el('p', { class: 'nota' }, ctx.t('falla')));
    return;
  }
  if (!sigue()) return;
  let objetivos, res;
  const porNombre = new Map(datos.ciudades.map((c) => [c.nombre, c]));
  if (retomada && retomada.ids.every((n) => porNombre.has(n))) {
    objetivos = retomada.ids.map((n) => porNombre.get(n));
    res = retomada.res;
  } else {
    objetivos = elegir(datos.ciudades, RONDA);
    res = [];
  }
  jugar(contenedor, ctx, sigue, lam, datos, objetivos, res);
}

function jugar(contenedor, ctx, sigue, lam, datos, objetivos, res) {
  const { t, guardado, sonido, fondo } = ctx;
  const fmt = (n) => n.toLocaleString(ctx.idioma === 'en' ? 'en' : 'es-AR');
  const { P, anillos, caja } = datos;
  const total = objetivos.length;
  let fase = 'poner'; // poner → resultado → (siguiente ronda | fin)
  let pin = null;
  let V = null;
  let nuevoPin = false;

  const lienzo = el('canvas', { role: 'img', 'aria-label': t('mapaAlt', { mapa: t(`lamina.${lam.id}`) }), class: 'mapa-lienzo' });
  const razon = Math.min(2, Math.max(0.8, ((caja.lonMax - caja.lonMin) * P.c) / (caja.latMax - caja.latMin)));
  lienzo.style.aspectRatio = String(razon);
  const g = lienzo.getContext('2d');
  const color = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const C = { mar: color('--mar'), tierra: color('--papel-claro'), trazo: color('--trazo'), tinta: color('--tinta'), marca: color('--bermellon-tinta') };

  const pregunta = el('h2', { class: 'mapa-pregunta' });
  const marcador = el('p', { class: 'etiqueta' });
  const estado = el('p', { class: 'nota', role: 'status', 'aria-live': 'polite' });
  const acciones = el('div', { class: 'fila' });
  const finPanel = el('div', { class: 'panel mapa-fin', hidden: true });

  const zoomBoton = (texto, aria, f) => el('button', { type: 'button', class: 'chip', 'aria-label': aria, onclick: () => { V = zoomEn(V, V.ancho / 2, V.alto / 2, f); pedir(); } }, texto);
  contenedor.replaceChildren(
    el('div', { class: 'mapa-cabeza' }, marcador, pregunta),
    el('figure', { class: 'lamina papel' },
      el('div', { class: 'lamina-cabeza' }, el('span', { class: 'etiqueta' }, t('laminaNum', { n: lam.num })), el('span', { class: 'lamina-titulo' }, t(`lamina.${lam.id}`)), el('span', { class: 'etiqueta' }, `${LAMINAS.indexOf(lam) + 1} / ${LAMINAS.length}`)),
      el('div', { class: 'lamina-cuadro' }, lienzo),
      el('figcaption', { class: 'lamina-pie etiqueta' }, el('span', {}, t('proyeccion')), el('span', {}, t('fuente')))),
    el('div', { class: 'fila' },
      zoomBoton('+', t('acercar'), 1.6), zoomBoton('−', t('alejar'), 1 / 1.6),
      el('button', { type: 'button', class: 'chip', onclick: () => { reencuadrar(); pedir(); } }, t('reencuadrar'))),
    estado, acciones, finPanel);

  function reencuadrar() { V = encuadre(caja, P, V.ancho, V.alto); }

  function medir() {
    const w = Math.max(1, lienzo.clientWidth), h = Math.max(1, lienzo.clientHeight), dpr = devicePixelRatio || 1;
    if (V && V.ancho === w && V.alto === h) return;
    lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr);
    V = encuadre(caja, P, w, h);
    pedir();
  }

  let raf = 0;
  function pedir() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; dibujar(); }); }

  function dibujar() {
    if (!V) return;
    const dpr = devicePixelRatio || 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = C.mar; g.fillRect(0, 0, V.ancho, V.alto);
    g.fillStyle = C.tierra; g.strokeStyle = C.trazo; g.lineWidth = 1; g.lineJoin = 'round';
    const mx = V.ancho / 2, my = V.alto / 2;
    g.beginPath();
    for (const a of anillos) {
      for (let i = 0; i < a.length; i += 2) {
        const x = (a[i] - V.cu) * V.s + mx, y = (V.cv - a[i + 1]) * V.s + my;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.closePath();
    }
    g.fill(); g.stroke();

    const objetivo = objetivos[fase === 'resultado' ? res.length - 1 : res.length]; // en el resultado, el lugar que se acaba de responder
    const punto = (c) => aPantalla(...proyectar(c.lon, c.lat, P), V);
    if (pin) {
      const [px, py] = punto(pin);
      if (fase === 'resultado') {
        const [tx, ty] = punto(objetivo);
        g.strokeStyle = C.tinta; g.lineWidth = 1.5; g.setLineDash([5, 4]);
        g.beginPath(); g.moveTo(px, py); g.lineTo(tx, ty); g.stroke(); g.setLineDash([]);
        g.fillStyle = C.tinta; g.beginPath(); g.arc(tx, ty, 6, 0, 7); g.fill();
        g.strokeStyle = C.tinta; g.lineWidth = 1; g.beginPath(); g.arc(tx, ty, 11, 0, 7); g.stroke();
      }
      g.strokeStyle = C.marca; g.fillStyle = C.marca; g.lineWidth = 2.5;
      g.beginPath(); g.arc(px, py, 7, 0, 7); g.stroke();
      g.beginPath(); g.moveTo(px - 12, py); g.lineTo(px + 12, py); g.moveTo(px, py - 12); g.lineTo(px, py + 12); g.stroke();
    }
  }

  // Gestos: un dedo arrastra (o toca para marcar), dos dedos pellizcan, la rueda acerca.
  const dedos = new Map();
  let movido = false, anterior = null;
  const local = (e) => { const r = lienzo.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const distancia = () => { const [a, b] = [...dedos.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  const medio = () => { const [a, b] = [...dedos.values()]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };

  lienzo.addEventListener('pointerdown', (e) => {
    lienzo.setPointerCapture(e.pointerId);
    dedos.set(e.pointerId, local(e));
    if (dedos.size === 1) { movido = false; anterior = { xy: local(e), ini: local(e) }; }
    else { movido = true; anterior = { d: distancia(), m: medio() }; }
  });
  lienzo.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId)) return;
    dedos.set(e.pointerId, local(e));
    if (dedos.size === 1) {
      const [x, y] = local(e);
      if (!movido && Math.hypot(x - anterior.ini[0], y - anterior.ini[1]) < 6) return;
      movido = true;
      V = mover(V, x - anterior.xy[0], y - anterior.xy[1]);
      anterior.xy = [x, y];
      pedir();
    } else if (dedos.size === 2 && anterior.d) {
      const d = distancia(), m = medio();
      V = mover(zoomEn(V, m[0], m[1], d / anterior.d), m[0] - anterior.m[0], m[1] - anterior.m[1]);
      anterior = { d, m };
      pedir();
    }
  });
  const soltar = (e) => {
    const eraUno = dedos.size === 1;
    dedos.delete(e.pointerId);
    if (dedos.size === 1) { movido = true; anterior = { xy: [...dedos.values()][0], ini: [...dedos.values()][0] }; }
    if (eraUno && !movido && e.type === 'pointerup' && fase === 'poner') {
      const [x, y] = local(e);
      const [lon, lat] = desproyectar(...dePantalla(x, y, V), P);
      pin = { lon, lat };
      nuevoPin = true;
      panel();
      pedir();
    }
  };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);
  lienzo.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [x, y] = local(e);
    V = zoomEn(V, x, y, Math.exp(-e.deltaY * 0.0015));
    pedir();
  }, { passive: false });

  const alCambiarTamano = new ResizeObserver(medir);
  alCambiarTamano.observe(lienzo);
  const anteriorLimpiar = limpiar;
  limpiar = () => { anteriorLimpiar(); alCambiarTamano.disconnect(); cancelAnimationFrame(raf); };

  const puntosAhora = () => res.reduce((s, r) => s + r.pts, 0);

  function panel() {
    const n = res.length + (fase === 'resultado' ? 0 : 1);
    const objetivo = objetivos[fase === 'resultado' ? res.length - 1 : Math.min(res.length, total - 1)];
    const lugar = objetivo.pais && datos.paises[objetivo.pais] ? t('lugarPais', { lugar: objetivo.nombre, pais: datos.paises[objetivo.pais] }) : objetivo.nombre;
    marcador.textContent = `${t('ronda', { n: Math.min(n, total), total })} · ${t('puntos', { n: fmt(puntosAhora()) })}`;
    pregunta.textContent = t('pregunta', { lugar });
    if (fase === 'poner') {
      estado.textContent = pin ? t('marcado') : t('toca');
      acciones.replaceChildren(el('button', { type: 'button', class: 'boton', disabled: pin ? null : true, onclick: confirmar }, t('confirmar')));
    } else {
      const ult = res[res.length - 1];
      estado.textContent = ult.km < 1 ? t('clavado', { pts: fmt(ult.pts) }) : t('resultado', { km: fmt(Math.round(ult.km)), pts: fmt(ult.pts) });
      acciones.replaceChildren(el('button', { type: 'button', class: 'boton', onclick: siguiente }, res.length >= total ? t('verResultado') : t('siguiente')));
    }
  }

  function confirmar() {
    if (fase !== 'poner' || !pin) return;
    const o = objetivos[res.length];
    const km = distanciaKm(pin.lon, pin.lat, o.lon, o.lat);
    const pts = puntaje(km, lam.escala);
    res.push({ km, pts });
    fase = 'resultado';
    guardado.escribir({ lamina: lam.id, ids: objetivos.map((c) => c.nombre), res });
    pts >= 500 ? sonido.acierto() : sonido.error();
    fondo.fijar({ tension: 0.1 + 0.8 * (res.length / total) });
    const [tx, ty] = aPantalla(...proyectar(o.lon, o.lat, P), V);
    if (tx < 20 || ty < 20 || tx > V.ancho - 20 || ty > V.alto - 20) reencuadrar(); // el lugar real tiene que verse
    panel();
    pedir();
  }

  function siguiente() {
    if (res.length >= total) return terminar();
    fase = 'poner'; pin = null; sonido.turno();
    panel();
    pedir();
  }

  function terminar() {
    const sumados = res.reduce((s, r) => s + r.pts, 0);
    const kms = res.map((r) => r.km).sort((a, b) => a - b);
    const tipico = Math.round((kms[Math.floor((kms.length - 1) / 2)] + kms[Math.ceil((kms.length - 1) / 2)]) / 2);
    guardado.anotar({ lamina: lam.id, puntos: sumados, kmTipico: tipico });
    guardado.borrar();
    sonido.fin();
    fondo.fijar({ tension: 0.1 });
    contenedor.replaceChildren(finPanel);
    finPanel.hidden = false;
    finPanel.replaceChildren(
      el('p', { class: 'etiqueta' }, t(`lamina.${lam.id}`)),
      el('p', { class: 'cifra' }, fmt(sumados)),
      el('p', { class: 'nota' }, t('total', { n: fmt(sumados) })),
      el('p', { class: 'etiqueta' }, t('tipico', { km: fmt(tipico) })),
      el('div', { class: 'fila' },
        el('button', { type: 'button', class: 'boton', onclick: () => empezar(contenedor, ctx, sigue, lam) }, t('otra')),
        el('button', { type: 'button', class: 'boton segundo', onclick: () => portada(contenedor, ctx, sigue) }, t('cambiar')),
        el('button', { type: 'button', class: 'boton quieto', onclick: () => ctx.salir() }, t('volver'))));
  }

  fase = res.length >= total ? 'resultado' : 'poner';
  if (res.length >= total) { terminar(); return; }
  panel();
  medir();
}

export default {
  id: 'donde-queda',
  familia: 'aprender',
  minutos: 5,
  usaIA: false,
  textos,
  carnet({ historial, t, fmt }) {
    return LAMINAS.map((l) => [l, historial.filter((h) => h.lamina === l.id)]).filter(([, h]) => h.length)
      .map(([l, h]) => [t(`lamina.${l.id}`), t('carnet.mejor', { n: fmt(Math.max(...h.map((x) => x.puntos))), rondas: h.length })]);
  },
  montar,
  desmontar() { limpiar(); limpiar = () => {}; },
};
