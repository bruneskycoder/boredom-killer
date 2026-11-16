// Arranque y navegación. Rutas por hash (funcionan en cualquier carpeta y sin servidor):
//   #/            lobby      #/ajustes   ajustes      #/modo/<id>   un modo
import { abrirGuardado } from './guardado.js';
import { IDIOMAS, idiomaInicial, unirTextos, traducir } from './i18n.js';
import { textosApp } from './textos-app.js';
import { crearFondo } from './fondo.js';
import * as sonido from './sonido.js';
import { crearVoz } from './voz.js';
import { crearInstalador, estaInstalada } from './instalar.js';
import { vistaLobby, vistaAjustes, vistaCarnet } from './vistas.js';
import { el } from './dom.js';
import { MODOS, TONO_FAMILIA } from '../modos/registro.js';

const TONO_LOBBY = '#ff4f2e';
const CALMO = 0.1;

const guardado = await abrirGuardado();
const dic = unirTextos(textosApp, MODOS);
let idioma = idiomaInicial(guardado.ajuste('idioma'), navigator.language);
const t = (clave, vars) => traducir(dic, idioma, clave, vars);

const fondo = crearFondo(document.getElementById('fondo'));
const voz = crearVoz();
const raiz = document.getElementById('vista');
const marca = document.getElementById('marca');
const enlaceAjustes = document.getElementById('enlace-ajustes');
const enlaceCarnet = document.getElementById('enlace-carnet');

let actual = null;   // { limpiar } de la vista en pantalla
let base = CALMO;    // tensión de reposo de la vista actual
let pulsoTimer = 0;

const app = {
  modos: MODOS, guardado, voz, instalador: null, filtro: 'todo',
  get idioma() { return idioma; },
  t,
  render: () => render(),
  instalada: estaInstalada,
  sonidoEncendido: () => guardado.ajuste('sonido', true),
  fijarSonido(v) { guardado.fijarAjuste('sonido', v); sonido.encender(v); sonido.tocar('turno'); render(); },
  fijarIdioma(v) { if (IDIOMAS.some((i) => i.id === v)) { guardado.fijarAjuste('idioma', v); idioma = v; aplicarIdioma(); render(); } },
  estadoOffline: () => (!('serviceWorker' in navigator) ? 'no' : navigator.serviceWorker.controller ? 'lista' : 'preparando'),
  async alImportar() { // después de importar pueden haber cambiado idioma y sonido
    idioma = idiomaInicial(guardado.ajuste('idioma'), navigator.language);
    sonido.encender(app.sonidoEncendido());
    aplicarIdioma();
    render();
  },
  exportar() {
    const archivo = guardado.exportar();
    const enlace = el('a', {
      href: URL.createObjectURL(new Blob([JSON.stringify(archivo, null, 1)], { type: 'application/json' })),
      download: `boredom-killer-${new Date().toLocaleDateString('sv')}.json`,
    });
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 4000);
  },
};
app.instalador = crearInstalador(() => { if (ruta().vista === 'lobby') render(); });

function aplicarIdioma() {
  document.documentElement.lang = IDIOMAS.find((i) => i.id === idioma).html;
  document.title = t('app.nombre');
  marca.lastChild.textContent = t('app.nombre');
  enlaceAjustes.textContent = t('nav.ajustes');
  enlaceCarnet.textContent = t('nav.carnet');
}

function ruta() {
  const [a, b] = location.hash.replace(/^#\/?/, '').split('/');
  if (a === 'ajustes') return { vista: 'ajustes' };
  if (a === 'carnet') return { vista: 'carnet' };
  if (a === 'modo') return { vista: 'modo', id: b };
  return { vista: 'lobby' };
}

// Al cambiar de pantalla el fondo da un respiro más intenso y vuelve a su reposo.
function pulso() {
  clearTimeout(pulsoTimer);
  fondo.fijar({ tension: Math.max(base, 0.5) });
  pulsoTimer = setTimeout(() => fondo.fijar({ tension: base }), 550);
}

function entrar(nodo) {
  raiz.replaceChildren(nodo);
  nodo.classList.add('entra');
}

let ultimaRuta = '';
function render() {
  actual?.limpiar?.();
  actual = null;
  const r = ruta();
  const clave = `${r.vista}/${r.id || ''}`;
  const cambio = clave !== ultimaRuta;
  ultimaRuta = clave;

  if (r.vista === 'modo') {
    const modo = MODOS.find((m) => m.id === r.id);
    if (!modo) return entrar(el('section', {}, el('p', { class: 'nota' }, t('modo.noExiste')), el('a', { class: 'boton segundo', href: '#/' }, t('nav.volver'))));
    base = CALMO;
    fondo.fijar({ tension: CALMO, tono: TONO_FAMILIA[modo.familia] });
    const cuerpo = el('div', { class: 'modo-cuerpo' });
    entrar(el('section', { class: 'modo' },
      el('header', { class: 'modo-cabeza' },
        el('a', { class: 'boton quieto', href: '#/' }, '← ', t('nav.volver')),
        el('span', { class: `etiqueta f-${modo.familia}` }, el('i', { class: 'punto' }), ' ', t(`familia.${modo.familia}`))),
      cuerpo));
    const ctx = {
      guardado: guardado.paraModo(modo.id),
      sonido: Object.fromEntries(sonido.nombres.map((n) => [n, () => sonido.tocar(n)])),
      fondo: { fijar(o = {}) { if (typeof o.tension === 'number') base = o.tension; fondo.fijar(o); } },
      voz,
      salir: () => { location.hash = '#/'; },
      t: (clave2, vars) => t(`modo.${modo.id}.${clave2}`, vars),
      idioma,
    };
    try { modo.montar(cuerpo, ctx); } catch (e) { console.error(e); cuerpo.replaceChildren(el('p', { class: 'nota' }, t('modo.falla'))); }
    actual = { limpiar: () => { try { modo.desmontar(); } catch (e) { console.error(e); } } };
    if (cambio) sonido.tocar('turno');
  } else {
    base = CALMO;
    fondo.fijar({ tension: CALMO, tono: TONO_LOBBY });
    const v = r.vista === 'ajustes' ? vistaAjustes(app) : r.vista === 'carnet' ? vistaCarnet(app) : vistaLobby(app);
    entrar(v.nodo);
    actual = v;
  }
  if (cambio) { pulso(); scrollTo(0, 0); }
}

// Esc vuelve al lobby desde cualquier pantalla (un modo puede quedarse la tecla con preventDefault).
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.defaultPrevented && ruta().vista !== 'lobby') location.hash = '#/';
});
addEventListener('hashchange', render);
// En iPhone el audio solo arranca después de un toque; en PC, después de una tecla o clic.
for (const tipo of ['pointerdown', 'keydown']) addEventListener(tipo, () => sonido.activar(), { once: true });

sonido.encender(app.sonidoEncendido());
aplicarIdioma();
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('Sin uso offline:', e));
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (ruta().vista === 'ajustes') render(); });
}
