// Silueta: la forma de un país sobre papel; se elige el nombre entre cuatro. Usa los datos del mapa mundial.
import { textos } from './textos.js';
import { el } from '../../nucleo/dom.js';
import { cajaDe, proyeccion, proyectar } from '../donde-queda/geo.js';
import { RONDA, anillosPrincipales, elegirRonda, opciones } from './logica.js';

let limpiar = () => {};
let paises = null;

async function cargar() {
  if (paises) return paises;
  const r = await fetch(new URL('../../datos/mapa-mundo.json', import.meta.url));
  if (!r.ok) throw new Error(`mapa-mundo.json: ${r.status}`);
  paises = (await r.json()).paises;
  return paises;
}

function montar(contenedor, ctx) {
  let vivo = true;
  limpiar = () => { vivo = false; };
  cargar().then((p) => { if (vivo) ronda(contenedor, ctx, p, () => vivo); })
    .catch((e) => { console.error(e); if (vivo) contenedor.replaceChildren(el('p', { class: 'nota' }, ctx.t('falla'))); });
}

// Dibuja la silueta centrada, con margen, escalada para entrar en el lienzo.
function dibujar(lienzo, pais) {
  const anillos = anillosPrincipales(pais.anillos);
  const caja = cajaDe(anillos), P = proyeccion(caja);
  const w = lienzo.clientWidth || 300, h = lienzo.clientHeight || 300, dpr = devicePixelRatio || 1;
  lienzo.width = Math.round(w * dpr); lienzo.height = Math.round(h * dpr);
  const g = lienzo.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const estilo = getComputedStyle(document.documentElement);
  g.fillStyle = estilo.getPropertyValue('--mar').trim(); g.fillRect(0, 0, w, h);
  const [u0, v0] = proyectar(caja.lonMin, caja.latMin, P), [u1, v1] = proyectar(caja.lonMax, caja.latMax, P);
  const s = Math.min(w / (u1 - u0 || 1), h / (v1 - v0 || 1)) * 0.82;
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  g.fillStyle = estilo.getPropertyValue('--tinta').trim();
  g.beginPath();
  for (const a of anillos) {
    for (let i = 0; i < a.length; i += 2) {
      const [u, v] = proyectar(a[i], a[i + 1], P);
      const x = (u - cu) * s + w / 2, y = (cv - v) * s + h / 2;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.closePath();
  }
  g.fill();
}

function ronda(contenedor, ctx, todos, sigue) {
  const { t, guardado, sonido, fondo } = ctx;
  const fmt = (n) => n.toLocaleString(ctx.idioma === 'en' ? 'en' : 'es-AR');
  const preguntas = elegirRonda(todos, RONDA);
  let i = 0, bien = 0, respondida = false;
  let quitarTeclas = () => {};
  const anteriorLimpiar = limpiar;
  limpiar = () => { anteriorLimpiar(); quitarTeclas(); };
  fondo.fijar({ tension: 0.1 });

  const paso = () => {
    quitarTeclas();
    if (i >= preguntas.length) return fin();
    const pais = preguntas[i];
    respondida = false;
    const lienzo = el('canvas', { class: 'silueta-lienzo', role: 'img', 'aria-label': t('alt') });
    const estado = el('p', { class: 'nota', role: 'status', 'aria-live': 'polite' });
    const acciones = el('div', { class: 'fila' });
    const lista = opciones(pais, todos);
    const botones = lista.map((o, k) => el('button', { type: 'button', class: 'boton segundo silueta-opcion', onclick: () => elegir(o, botones[k]) }, `${k + 1} · ${o.nombre}`));

    function elegir(o, boton) {
      if (respondida) return;
      respondida = true;
      const acierto = o.id === pais.id;
      if (acierto) bien++;
      botones.forEach((b, k) => { b.disabled = true; if (lista[k].id === pais.id) b.classList.add('es-correcta'); });
      if (!acierto) boton.classList.add('es-errada');
      estado.textContent = acierto ? t('bien', { pais: pais.nombre }) : t('mal', { pais: pais.nombre });
      acierto ? sonido.acierto() : sonido.error();
      fondo.fijar({ tension: 0.1 + 0.6 * ((i + 1) / preguntas.length) });
      acciones.replaceChildren(el('button', { type: 'button', class: 'boton', onclick: () => { i++; paso(); } }, i + 1 >= preguntas.length ? t('verResultado') : t('siguiente')));
      acciones.firstChild.focus({ preventScroll: true });
    }

    const f = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = Number(e.key) - 1;
      if (!respondida && k >= 0 && k < botones.length) { e.preventDefault(); botones[k].click(); }
    };
    document.addEventListener('keydown', f);
    quitarTeclas = () => document.removeEventListener('keydown', f);

    contenedor.replaceChildren(
      el('p', { class: 'etiqueta' }, `${t('ronda', { n: i + 1, total: preguntas.length })} · ${t('puntos', { n: bien })}`),
      el('h2', {}, t('pregunta')),
      el('figure', { class: 'lamina papel' }, el('div', { class: 'lamina-cuadro' }, lienzo)),
      el('div', { class: 'silueta-opciones' }, botones),
      estado, acciones);
    dibujar(lienzo, pais);
  };

  const fin = () => {
    guardado.anotar({ puntos: bien, de: preguntas.length });
    sonido.fin();
    fondo.fijar({ tension: 0.1 });
    contenedor.replaceChildren(el('div', { class: 'panel silueta-fin' },
      el('p', { class: 'cifra' }, `${fmt(bien)}/${preguntas.length}`),
      el('p', { class: 'nota' }, t('total', { n: fmt(bien), total: preguntas.length })),
      el('div', { class: 'fila' },
        el('button', { type: 'button', class: 'boton', onclick: () => sigue() && ronda(contenedor, ctx, todos, sigue) }, t('otra')),
        el('button', { type: 'button', class: 'boton quieto', onclick: () => ctx.salir() }, t('volver')))));
  };
  paso();
}

export default {
  id: 'silueta',
  familia: 'mirar',
  minutos: 4,
  usaIA: false,
  textos,
  carnet({ historial, t, fmt }) {
    const h = historial.filter((x) => typeof x.puntos === 'number');
    if (!h.length) return [];
    return [[t('carnet.mejor'), `${Math.max(...h.map((x) => x.puntos))}/${RONDA}`], [t('carnet.promedio'), fmt(Math.round((h.reduce((s, x) => s + x.puntos, 0) / h.length) * 10) / 10)], [t('carnet.rondas'), fmt(h.length)]];
  },
  montar,
  desmontar() { limpiar(); limpiar = () => {}; },
};
