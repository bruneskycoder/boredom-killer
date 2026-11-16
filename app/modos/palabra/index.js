// Palabra de campo: la palabra del día (o una de práctica), cinco letras, seis intentos.
import { textos } from './textos.js';
import { el } from '../../nucleo/dom.js';
import { LARGO, INTENTOS, normalizar, puntuar, estadosTeclas, fechaLocal, palabraDelDia, calcularRacha } from './logica.js';

const FILAS = ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'];
const VERDE = '#3ddc84';
let limpiar = () => {};

async function cargar() {
  const r = await fetch(new URL('../../datos/palabras5.json', import.meta.url));
  if (!r.ok) throw new Error(`palabras5.json: ${r.status}`);
  return r.json();
}

function montar(contenedor, ctx) {
  const { t } = ctx;
  let vivo = true;
  cargar().then((datos) => { if (vivo) jugar(contenedor, ctx, datos); })
    .catch((e) => { console.error(e); if (vivo) contenedor.replaceChildren(el('p', { class: 'nota' }, t('falla'))); });
  limpiar = () => { vivo = false; };
}

function jugar(contenedor, ctx, datos) {
  const { t, guardado, sonido, fondo } = ctx;
  const validas = new Set(datos.validas);
  const hoy = fechaLocal();

  // Estado: la palabra del día se retoma si hay partida de hoy; si no, se empieza una nueva.
  const previa = guardado.leer();
  let est;
  if (previa && previa.dia === hoy && Array.isArray(previa.intentos)) {
    est = { secreta: palabraDelDia(datos.respuestas, hoy), intentos: previa.intentos, fin: previa.fin || null, practica: false };
  } else {
    est = { secreta: palabraDelDia(datos.respuestas, hoy), intentos: [], fin: null, practica: false };
  }
  let actual = '';
  let mensaje = '';

  const tablero = el('div', { class: 'palabra-tablero', role: 'grid', 'aria-label': t('nombre') });
  const aviso = el('p', { class: 'nota palabra-aviso', role: 'status', 'aria-live': 'polite' });
  const resultado = el('div', { class: 'panel palabra-resultado', hidden: true });
  const teclado = el('div', { class: 'teclado palabra-teclado', 'aria-label': t('teclado') });
  contenedor.replaceChildren(
    el('p', { class: 'nota' }, t('ayuda')),
    el('div', { class: 'panel palabra-mesa' }, tablero, aviso, teclado),
    resultado);

  const racha = () => calcularRacha(guardado.historial(), hoy);

  function dibujar() {
    const estados = estadosTeclas(est.intentos, est.secreta);
    tablero.replaceChildren(...Array.from({ length: INTENTOS }, (_, fila) => {
      const intento = est.intentos[fila];
      const letras = intento ? Array.from(intento) : est.fin || fila !== est.intentos.length ? [] : Array.from(actual);
      const res = intento ? puntuar(intento, est.secreta) : [];
      return el('div', { class: 'casillas', role: 'row', 'aria-label': t('intento', { n: fila + 1 }) },
        Array.from({ length: LARGO }, (_, i) => el('span', {
          role: 'gridcell',
          class: ['casilla', res[i], !intento && !est.fin && fila === est.intentos.length && i === letras.length ? 'cursor' : ''].filter(Boolean).join(' '),
        }, letras[i] || '')));
    }));
    teclado.replaceChildren(...FILAS.map((fila, n) => el('div', { class: 'fila-teclas' },
      n === 2 ? tecla('Enter', t('enviar'), 'ancha') : null,
      Array.from(fila).map((l) => tecla(l, l, estados[l] || '')),
      n === 2 ? tecla('Backspace', '⌫', 'ancha', t('borrar')) : null)));
    aviso.textContent = est.practica && !est.fin ? t('practica') : mensaje;

    resultado.hidden = !est.fin;
    if (est.fin) {
      const gano = est.fin === 'gano';
      const palabra = est.secreta.toUpperCase();
      resultado.replaceChildren(
        el('p', { class: 'cifra-chica' }, gano ? t('gano', { palabra, n: est.intentos.length }) : t('perdio', { palabra })),
        est.practica ? el('p', { class: 'nota' }, t('practica')) : el('p', { class: 'etiqueta' }, t('racha', { n: racha() })),
        est.practica ? null : el('p', { class: 'nota' }, t('volve')),
        el('div', { class: 'fila' },
          el('button', { type: 'button', class: 'boton segundo', onclick: otra }, t('otra')),
          el('button', { type: 'button', class: 'boton quieto', onclick: () => ctx.salir() }, t('volver'))));
    }
  }

  // Teclas en pantalla: no toman el foco (así Enter y Espacio del teclado real no las vuelven a apretar).
  function tecla(valor, texto, clase, etiqueta) {
    return el('button', {
      type: 'button', class: `tecla ${clase}`.trim(), tabindex: '-1', 'aria-label': etiqueta || (valor.length === 1 ? valor : texto),
      onmousedown: (e) => e.preventDefault(), onclick: () => apretar(valor),
    }, texto);
  }

  function apretar(k) {
    if (est.fin) return;
    mensaje = '';
    if (k === 'Backspace') actual = actual.slice(0, -1);
    else if (k === 'Enter') return enviar();
    else if (Array.from(k).length === 1 && /^[a-zñ]$/.test(normalizar(k)) && actual.length < LARGO) actual += normalizar(k);
    dibujar();
  }

  function enviar() {
    if (actual.length < LARGO) { mensaje = t('faltan'); sonido.error(); return dibujar(); }
    if (!validas.has(actual)) { mensaje = t('noEsta'); sonido.error(); return dibujar(); }
    est.intentos.push(actual);
    actual = '';
    const gano = est.intentos[est.intentos.length - 1] === est.secreta;
    if (gano) est.fin = 'gano';
    else if (est.intentos.length >= INTENTOS) est.fin = 'perdio';
    fondo.fijar({ tension: 0.1 + 0.14 * est.intentos.length, tono: gano ? VERDE : undefined });
    if (!est.practica) {
      guardado.escribir({ dia: hoy, intentos: est.intentos, fin: est.fin });
      if (est.fin) guardado.anotar({ dia: hoy, gano, intentos: est.intentos.length });
    }
    if (gano) sonido.fin(); else if (est.fin) sonido.error(); else sonido.turno();
    dibujar();
  }

  function otra() {
    const al = datos.respuestas[Math.floor(Math.random() * datos.respuestas.length)];
    est = { secreta: al, intentos: [], fin: null, practica: true };
    actual = ''; mensaje = '';
    fondo.fijar({ tension: 0.1 });
    dibujar();
  }

  const alTeclear = (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(A|BUTTON|INPUT)$/.test(e.target.tagName)) return;
    if (e.key === 'Enter' || e.key === 'Backspace' || (e.key.length === 1 && /^[a-zñáéíóúü]$/i.test(e.key))) {
      e.preventDefault();
      apretar(e.key);
    }
  };
  document.addEventListener('keydown', alTeclear);
  const anterior = limpiar;
  limpiar = () => { anterior(); document.removeEventListener('keydown', alTeclear); };

  fondo.fijar({ tension: 0.1 + 0.14 * est.intentos.length, tono: est.fin === 'gano' ? VERDE : undefined });
  dibujar();
}

export default {
  id: 'palabra',
  familia: 'jugar',
  minutos: 5,
  usaIA: false,
  textos,
  carnet({ historial, t, fmt }) {
    const jugadas = historial.filter((h) => typeof h.dia === 'string');
    if (!jugadas.length) return [];
    const ganadas = jugadas.filter((h) => h.gano);
    const filas = [[t('carnet.racha'), calcularRacha(historial, fechaLocal())], [t('carnet.ganadas'), `${ganadas.length} / ${jugadas.length}`]];
    if (ganadas.length) filas.push([t('carnet.promedio'), fmt(Math.round((ganadas.reduce((s, h) => s + h.intentos, 0) / ganadas.length) * 10) / 10)]);
    return filas;
  },
  montar,
  desmontar() { limpiar(); limpiar = () => {}; },
};
