// Inglés: prueba de nivel, tarjetas con repaso espaciado (SM-2) y dictado. Todo sin IA y sin conexión.
import { textos } from './textos.js';
import { el } from '../../nucleo/dom.js';
import { fechaLocal } from '../palabra/logica.js';
import { NIVELES, prepararVocab, sumarDias, diasEntre, sm2, elegirMuestra, ubicarNivel, sembrarPrueba, construirCola, cuantasVencen, resaltar, compararDictado } from './logica.js';

let limpiar = () => {};
let cargado = null;

async function cargar() {
  if (cargado) return cargado;
  const r = await fetch(new URL('../../datos/ingles.json', import.meta.url));
  if (!r.ok) throw new Error(`ingles.json: ${r.status}`);
  const d = await r.json();
  const vocab = prepararVocab(d.vocabulario);
  cargado = { vocab, porPalabra: new Map(vocab.map((v) => [v.palabra, v])), oraciones: d.oraciones };
  return cargado;
}

function montar(contenedor, ctx) {
  let vivo = true;
  limpiar = () => { vivo = false; };
  cargar().then((datos) => { if (vivo) iniciar(contenedor, ctx, datos, () => vivo); })
    .catch((e) => { console.error(e); if (vivo) contenedor.replaceChildren(el('p', { class: 'nota' }, ctx.t('falla'))); });
}

function iniciar(contenedor, ctx, datos, sigue) {
  const { t, guardado, sonido, fondo, voz } = ctx;
  const { vocab, porPalabra, oraciones } = datos;
  const hoy = fechaLocal();
  const previa = guardado.leer();
  const est = previa && previa.version === 1 ? previa : { version: 1, nivel: null, estados: {}, pendientes: [], nuevas: { dia: hoy, n: 0 } };
  if (est.nuevas.dia !== hoy) est.nuevas = { dia: hoy, n: 0 };
  const guardar = () => guardado.escribir(est);
  let quitarTeclas = () => {};
  const pantalla = (nodos) => { quitarTeclas(); quitarTeclas = () => {}; contenedor.replaceChildren(...nodos); };
  const atajos = (mapa) => {
    const f = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || /^(A|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      const accion = mapa[e.key];
      if (accion) { e.preventDefault(); accion(); }
    };
    document.addEventListener('keydown', f);
    quitarTeclas = () => document.removeEventListener('keydown', f);
  };
  const boton = (texto, onclick, clase = '') => el('button', { type: 'button', class: `boton ${clase}`.trim(), onclick }, texto);
  const barra = (v) => el('div', { class: 'medidor', style: `--v:${Math.round(v * 100)}%` }, el('i'));
  const oracionDe = (v, k = 0) => oraciones[v.ids[k % v.ids.length]];
  const dibujarOracion = (oracion, palabra) => {
    const partes = resaltar(oracion, palabra);
    return partes ? el('p', { class: 'ejemplo', lang: 'en' }, partes[0], el('b', {}, partes[1]), partes[2]) : el('p', { class: 'ejemplo', lang: 'en' }, oracion);
  };
  const escuchar = (texto) => el('div', { class: 'fila' },
    boton(t('escuchar'), () => voz.decir(texto), 'segundo'),
    boton(t('lento'), () => voz.decir(texto, { velocidad: 0.6 }), 'quieto'));
  const cuando = (dia) => (dia <= hoy ? t('hoy') : dia === sumarDias(hoy, 1) ? t('manana') : t('en', { n: diasEntre(hoy, dia) }));

  // ---------- Inicio ----------
  function inicio() {
    fondo.fijar({ tension: 0.1 });
    if (!est.nivel) {
      return pantalla([
        el('p', { class: 'nota' }, t('ayuda')),
        el('div', { class: 'panel ing-panel' }, el('p', {}, t('pruebaAyuda')), boton(t('empezarPrueba'), prueba)),
      ]);
    }
    const cola = construirCola({ estados: est.estados, vocab, hoy, nivel: est.nivel, pendientes: est.pendientes, nuevasHoy: est.nuevas.n });
    const vencen = cuantasVencen(est.estados, hoy);
    const nuevas = cola.filter((c) => c.tipo === 'nueva').length;
    const proximo = Object.values(est.estados).map((e) => e.vence).sort()[0];
    pantalla([
      el('div', { class: 'panel ing-panel' },
        el('p', { class: 'etiqueta' }, t('tuNivel', { nivel: est.nivel })),
        el('p', { class: 'cifra-chica' }, t('paraRepasar', { n: vencen })),
        el('p', { class: 'nota' }, t('nuevasHoy', { n: nuevas })),
        cola.length ? boton(t('estudiar'), () => estudiar(cola)) : el('p', { class: 'nota' }, t('nadaHoy'), proximo ? ` ${t('proximo', { cuando: cuando(proximo) })}.` : ''),
        el('div', { class: 'fila' }, boton(t('dictado'), dictado, 'segundo'), boton(t('repetirPrueba'), prueba, 'quieto'))),
    ]);
  }

  // ---------- Prueba de nivel ----------
  function prueba() {
    const muestra = elegirMuestra(vocab);
    const respuestas = [];
    const paso = () => {
      const i = respuestas.length;
      if (i >= muestra.length) return resultadoPrueba(respuestas);
      const v = muestra[i];
      const responder = (sabe) => { respuestas.push({ palabra: v.palabra, nivel: v.nivel, sabe }); sonido.turno(); paso(); };
      atajos({ ArrowRight: () => responder(true), ArrowLeft: () => responder(false), y: () => responder(true), n: () => responder(false) });
      pantalla([
        el('p', { class: 'etiqueta' }, t('palabraN', { n: i + 1, total: muestra.length })),
        barra(i / muestra.length),
        el('article', { class: 'ficha papel' },
          el('p', { class: 'cabeza etiqueta' }, el('span', {}, v.categoria)),
          el('h3', { class: 'voz', lang: 'en' }, v.palabra),
          dibujarOracion(oracionDe(v)[0], v.palabra),
          el('div', { class: 'fila' }, boton(t('noLaSe'), () => responder(false), 'segundo'), boton(t('laSe'), () => responder(true)))),
      ]);
    };
    paso();
  }

  function resultadoPrueba(respuestas) {
    const nivel = ubicarNivel(respuestas);
    const { estados, pendientes } = sembrarPrueba(respuestas, hoy);
    // Se conserva lo ya estudiado antes de repetir la prueba.
    est.nivel = nivel;
    est.estados = { ...estados, ...est.estados };
    est.pendientes = pendientes;
    guardar();
    guardado.anotar({ tipo: 'nivel', nivel });
    sonido.fin();
    pantalla([
      el('div', { class: 'panel ing-panel' },
        el('p', { class: 'cifra-chica' }, t('nivelResultado', { nivel })),
        el('p', { class: 'nota' }, t('nivelNota')),
        boton(t('empezar'), inicio)),
    ]);
  }

  // ---------- Tarjetas ----------
  function estudiar(cola) {
    const total = cola.length;
    let hechas = 0, bien = 0, nuevas = 0;
    const fila = [...cola];
    const paso = () => {
      if (!fila.length) return terminar();
      const item = fila.shift();
      const v = porPalabra.get(item.palabra);
      if (!v) return paso();
      const estado = est.estados[item.palabra];
      const [en, es, autorEn, autorEs, idEs] = oracionDe(v, estado ? estado.rep : 0);
      const idEn = v.ids[(estado ? estado.rep : 0) % v.ids.length];
      let abierta = false;
      const rotulo = item.tipo === 'nueva' ? t('tipoNueva') : item.tipo === 'otra' ? t('tipoOtra') : t('tipoRepaso');
      const dorso = el('div', { class: 'ing-dorso', hidden: true },
        el('p', { class: 'traduccion' }, es),
        el('p', { class: 'etiqueta' }, t('fuente', { id: idEn, en: autorEn, es: autorEs })),
        el('div', { class: 'fila' },
          boton(t('noSabia'), () => calificar(1), 'segundo'), boton(t('sabia'), () => calificar(4)), boton(t('facil'), () => calificar(5), 'segundo')));
      const mostrar = el('div', { class: 'fila' }, boton(t('mostrar'), () => abrir()));
      function abrir() { if (abierta) return; abierta = true; dorso.hidden = false; mostrar.hidden = true; }
      function calificar(q) {
        if (item.tipo === 'otra') { /* segunda vuelta de una fallada: no vuelve a tocar el calendario */ }
        else {
          est.estados[item.palabra] = sm2(estado, q, hoy);
          if (item.tipo === 'nueva') { est.nuevas.n += 1; nuevas += 1; est.pendientes = est.pendientes.filter((p) => p !== item.palabra); }
          hechas += 1;
          if (q >= 3) bien += 1; else fila.push({ palabra: item.palabra, tipo: 'otra' });
        }
        guardar();
        q >= 3 ? sonido.acierto() : sonido.error();
        fondo.fijar({ tension: 0.1 + 0.5 * Math.min(1, (total - fila.length) / total) });
        paso();
      }
      atajos({ ' ': abrir, Enter: abrir, 1: () => abierta && calificar(1), 2: () => abierta && calificar(4), 3: () => abierta && calificar(5) });
      pantalla([
        el('p', { class: 'etiqueta' }, `${rotulo} · ${t('progreso', { n: Math.min(total, total - fila.length), total })}`),
        barra((total - fila.length - 1) / total),
        el('article', { class: 'ficha papel' },
          el('p', { class: 'cabeza etiqueta' }, el('span', {}, v.categoria), el('span', { class: 'nivel' }, v.nivel)),
          el('h3', { class: 'voz', lang: 'en' }, v.palabra),
          dibujarOracion(en, v.palabra),
          escuchar(en), mostrar, dorso),
      ]);
    };
    const terminar = () => {
      guardado.anotar({ tipo: 'sesion', repasadas: hechas, bien, nuevas });
      sonido.fin();
      fondo.fijar({ tension: 0.1 });
      const proximo = Object.values(est.estados).map((e) => e.vence).sort()[0];
      pantalla([
        el('div', { class: 'panel ing-panel' },
          el('p', { class: 'cifra-chica' }, t('fin')),
          el('p', {}, t('finResumen', { n: hechas, ok: bien, nuevas })),
          proximo ? el('p', { class: 'etiqueta' }, t('proximo', { cuando: cuando(proximo) })) : null,
          el('div', { class: 'fila' }, boton(t('inicio'), inicio), boton(t('dictado'), dictado, 'segundo'))),
      ]);
    };
    paso();
  }

  // ---------- Dictado ----------
  function dictado() {
    const maxNivel = NIVELES.indexOf(est.nivel || 'A1');
    const pool = vocab.filter((v) => NIVELES.indexOf(v.nivel) <= maxNivel);
    const elegirOracion = () => {
      for (let k = 0; k < 40; k++) {
        const v = pool[Math.floor(Math.random() * pool.length)];
        const o = oracionDe(v, Math.floor(Math.random() * v.ids.length));
        if (o[0].split(/\s+/).length <= 12 && o[0].split(/\s+/).length >= 3) return o;
      }
      return oracionDe(pool[0]);
    };
    const nueva = () => {
      const [en, es] = elegirOracion();
      const campo = el('input', { class: 'campo', type: 'text', placeholder: t('escribi'), autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', lang: 'en', 'aria-label': t('escribi') });
      const salida = el('div', { class: 'ing-salida', role: 'status', 'aria-live': 'polite' });
      const comprobar = () => {
        const r = compararDictado(en, campo.value);
        const pct = Math.round(r.precision * 100);
        guardado.anotar({ tipo: 'dictado', precision: pct });
        r.precision === 1 ? sonido.acierto() : sonido.error();
        salida.replaceChildren(
          el('p', { class: 'cifra-chica' }, t('precision', { n: pct })),
          el('p', { class: 'dic-linea', lang: 'en' }, r.palabras.map((p) => el('span', { class: p.ok ? 'dic-ok' : 'dic-mal' }, p.palabra, ' '))),
          r.sobran ? el('p', { class: 'nota' }, t('sobraron', { n: r.sobran })) : null,
          el('p', { class: 'traduccion' }, es),
          boton(t('otra'), nueva));
      };
      campo.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); comprobar(); } });
      pantalla([
        el('p', { class: 'nota' }, t('dictadoAyuda')),
        el('div', { class: 'panel ing-panel' },
          voz.disponible() ? null : el('p', { class: 'nota alerta' }, t('sinVoz')),
          escuchar(en), campo,
          el('div', { class: 'fila' }, boton(t('comprobar'), comprobar), boton(t('inicio'), inicio, 'quieto')),
          salida),
      ]);
      setTimeout(() => voz.decir(en), 150);
    };
    nueva();
  }

  const salirInicio = () => { quitarTeclas(); voz.callar(); };
  const previoLimpiar = limpiar;
  limpiar = () => { previoLimpiar(); salirInicio(); };
  inicio();
}

export default {
  id: 'ingles',
  familia: 'aprender',
  minutos: 10,
  usaIA: false,
  textos,
  carnet({ historial, partida, t, fmt }) {
    if (!partida?.nivel) return [];
    const e = Object.values(partida.estados || {});
    const dic = historial.filter((h) => h.tipo === 'dictado');
    const filas = [[t('carnet.nivel'), partida.nivel], [t('carnet.estudiadas'), fmt(e.length)], [t('carnet.firmes'), fmt(e.filter((x) => x.int >= 21).length)], [t('carnet.sesiones'), fmt(historial.filter((h) => h.tipo === 'sesion').length)]];
    if (dic.length) filas.push([t('carnet.dictado'), `${Math.round(dic.reduce((s, h) => s + h.precision, 0) / dic.length)} %`]);
    return filas;
  },
  montar,
  desmontar() { limpiar(); limpiar = () => {}; },
};
