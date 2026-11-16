// Las dos pantallas propias de la app: lobby y ajustes. Cada una devuelve { nodo, limpiar }.
import { el } from './dom.js';
import { IDIOMAS } from './i18n.js';
import { FAMILIAS } from '../modos/registro.js';
import { tipoAviso } from './instalar.js';
import { elegirPorMi } from './elegir.js';

const selector = (etiqueta, opciones, actual, alElegir) =>
  el('div', { class: 'selector', role: 'group', 'aria-label': etiqueta },
    opciones.map(([valor, texto]) => el('button', { type: 'button', 'aria-pressed': String(valor === actual), onclick: () => alElegir(valor) }, texto)));

function avisos(app) {
  const { t, guardado } = app;
  const salida = [];
  const deuda = guardado.aviso();
  if (deuda) {
    salida.push(el('div', { class: 'panel aviso', role: 'status' },
      el('p', {}, deuda.nunca ? t('aviso.exportarNunca') : t('aviso.exportar', { n: deuda.dias })),
      el('div', { class: 'fila' }, el('button', { type: 'button', class: 'boton', onclick: () => { app.exportar(); app.render(); } }, t('aviso.exportarBoton')))));
  }
  const tipo = tipoAviso({
    ua: navigator.userAgent, plataforma: navigator.platform, puntos: navigator.maxTouchPoints,
    standalone: app.instalada(), hayPrompt: app.instalador.hayPrompt(), cerrado: guardado.ajuste('avisoInstalarCerrado', false),
  });
  if (tipo) {
    const cerrar = el('button', { type: 'button', class: 'boton quieto', onclick: () => { guardado.fijarAjuste('avisoInstalarCerrado', true); app.render(); } }, t('aviso.cerrar'));
    salida.push(el('div', { class: 'panel aviso', role: 'status' },
      el('p', {}, tipo === 'ios' ? t('aviso.ios') : t('aviso.instalar')),
      el('div', { class: 'fila' },
        tipo === 'prompt' ? el('button', { type: 'button', class: 'boton', onclick: () => app.instalador.instalar() }, t('aviso.instalarBoton')) : null,
        cerrar)));
  }
  return salida;
}

export function vistaLobby(app) {
  const { t, modos } = app;
  const presentes = FAMILIAS.filter((f) => modos.some((m) => m.familia === f));
  const visibles = modos.filter((m) => app.filtro === 'todo' || m.familia === app.filtro);

  const tarjetas = visibles.map((m, i) =>
    el('a', { class: 'tarjeta', href: `#/modo/${m.id}`, 'aria-current': i === 0 ? 'true' : null },
      el('span', { class: 'cabeza etiqueta' },
        el('span', { class: `f-${m.familia}` }, el('i', { class: 'punto' }), t(`familia.${m.familia}`)),
        el('span', {}, t('lobby.minutos', { n: m.minutos }))),
      el('h3', {}, t(`modo.${m.id}.nombre`)),
      el('span', { class: 'linea' }, t(`modo.${m.id}.linea`))));
  for (const c of tarjetas) {
    c.addEventListener('focus', () => { tarjetas.forEach((x) => x.removeAttribute('aria-current')); c.setAttribute('aria-current', 'true'); });
  }

  const filtros = presentes.length > 1 ? el('div', { class: 'fila', role: 'group' },
    [['todo', t('lobby.todo'), ''], ...presentes.map((f) => [f, t(`familia.${f}`), `f-${f}`])].map(([valor, texto, clase]) =>
      el('button', { type: 'button', class: `chip ${clase}`.trim(), 'aria-pressed': String(app.filtro === valor), onclick: () => { app.filtro = valor; app.render(); } },
        valor === 'todo' ? null : el('i', { class: 'punto' }), texto))) : null;

  // Teclado: flechas mueven el foco entre tarjetas; Enter abre la marcada (si el foco ya está en una, abre el enlace solo).
  const porMi = () => { const id = elegirPorMi(modos.map((m) => m.id), app.guardado.historial()); if (id) location.hash = `#/modo/${id}`; };
  const tecla = (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !tarjetas.length) return;
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); return porMi(); }
    const flechas = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    const actual = tarjetas.indexOf(document.activeElement);
    if (e.key in flechas) {
      e.preventDefault();
      const base = actual >= 0 ? actual : Math.max(0, tarjetas.findIndex((c) => c.getAttribute('aria-current') === 'true'));
      const nueva = actual >= 0 ? (base + flechas[e.key] + tarjetas.length) % tarjetas.length : base;
      tarjetas[nueva].focus();
    } else if (e.key === 'Enter' && actual < 0 && !/^(BUTTON|A|INPUT)$/.test(document.activeElement?.tagName || '')) {
      tarjetas.find((c) => c.getAttribute('aria-current') === 'true')?.click();
    }
  };
  document.addEventListener('keydown', tecla);

  const nodo = el('section', { class: 'lobby' },
    el('h1', {}, t('lobby.titulo')),
    ...avisos(app),
    el('div', { class: 'fila' }, el('button', { type: 'button', class: 'boton', onclick: porMi }, t('lobby.elegir'))),
    filtros,
    el('div', { class: 'grilla' }, tarjetas),
    el('p', { class: 'etiqueta teclas' }, el('kbd', {}, '↑'), ' ', el('kbd', {}, '↓'), ' ', t('lobby.teclas')));
  return { nodo, limpiar: () => document.removeEventListener('keydown', tecla) };
}

export function vistaAjustes(app) {
  const { t, guardado } = app;
  const estado = el('p', { class: 'nota', role: 'status', 'aria-live': 'polite' });
  const mensaje = (clave) => { estado.textContent = t(clave); };

  const archivo = el('input', { type: 'file', accept: 'application/json,.json', hidden: true });
  archivo.addEventListener('change', async () => {
    const f = archivo.files[0];
    archivo.value = '';
    if (!f || !confirm(t('ajustes.confirmarImportar'))) return;
    const r = guardado.importar(await f.text());
    if (!r.ok) return mensaje(`ajustes.error.${r.error}`);
    await app.alImportar();
    mensaje('ajustes.importado');
  });

  const ultimo = guardado.ultimoExport;
  const dias = ultimo == null ? null : Math.floor((Date.now() - ultimo) / 86400000);
  const cuando = dias == null ? t('ajustes.nunca') : dias <= 0 ? t('ajustes.hoy') : t('ajustes.hace', { n: dias });

  const etiquetaUltimo = el('p', { class: 'etiqueta' }, t('ajustes.ultimo', { cuando }));
  const exportar = () => { app.exportar(); etiquetaUltimo.textContent = t('ajustes.ultimo', { cuando: t('ajustes.hoy') }); mensaje('ajustes.exportado'); };

  const nodo = el('section', { class: 'ajustes' },
    el('h1', { class: 'titulo-chico' }, t('ajustes.titulo')),
    el('div', { class: 'bloque' },
      el('p', { class: 'etiqueta' }, t('ajustes.idioma')),
      selector(t('ajustes.idioma'), IDIOMAS.map((i) => [i.id, i.etiqueta]), app.idioma, (v) => app.fijarIdioma(v))),
    el('div', { class: 'bloque' },
      el('p', { class: 'etiqueta' }, t('ajustes.sonido')),
      selector(t('ajustes.sonido'), [[true, t('ajustes.sonidoCon')], [false, t('ajustes.sonidoSin')]], app.sonidoEncendido(), (v) => app.fijarSonido(v))),
    el('div', { class: 'bloque' },
      el('p', { class: 'etiqueta' }, t('ajustes.datos')),
      el('p', { class: 'nota' }, t('ajustes.datosNota')),
      guardado.persistente ? null : el('p', { class: 'nota alerta' }, t('ajustes.sinPersistencia')),
      el('div', { class: 'fila' },
        el('button', { type: 'button', class: 'boton', onclick: exportar }, t('ajustes.exportar')),
        el('button', { type: 'button', class: 'boton segundo', onclick: () => archivo.click() }, t('ajustes.importar')),
        archivo),
      etiquetaUltimo,
      estado),
    el('div', { class: 'bloque' },
      el('p', { class: 'etiqueta' }, t('ajustes.offline')),
      el('p', { class: 'nota', 'data-offline': app.estadoOffline() }, t(`ajustes.offline.${app.estadoOffline()}`))));
  return { nodo, limpiar() {} };
}

export function vistaCarnet(app) {
  const { t, guardado } = app;
  const fmt = (n) => n.toLocaleString(app.idioma === 'en' ? 'en' : 'es-AR');
  const bloques = app.modos.map((m) => {
    const filas = typeof m.carnet === 'function'
      ? m.carnet({ historial: guardado.historial(m.id), partida: guardado.partida(m.id), t: (k, v) => t(`modo.${m.id}.${k}`, v), fmt })
      : [];
    if (!filas.length) return null;
    return el('div', { class: 'bloque' },
      el('p', { class: `etiqueta f-${m.familia}` }, el('i', { class: 'punto' }), ' ', t(`modo.${m.id}.nombre`)),
      el('dl', { class: 'carnet' }, filas.flatMap(([k, v]) => [el('dt', { class: 'etiqueta' }, k), el('dd', {}, String(v))])));
  }).filter(Boolean);
  const nodo = el('section', { class: 'carnet-vista' },
    el('h1', { class: 'titulo-chico' }, t('carnet.titulo')),
    bloques.length ? bloques : el('p', { class: 'nota' }, t('carnet.vacio')));
  return { nodo, limpiar() {} };
}
