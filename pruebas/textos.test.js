import { prueba, igual, verdad } from './corredor.js';
import { IDIOMAS, idiomaInicial, interpolar, traducir, unirTextos } from '../app/nucleo/i18n.js';
import { textosApp } from '../app/nucleo/textos-app.js';
import { MODOS, FAMILIAS, TONO_FAMILIA } from '../app/modos/registro.js';

const marcas = (s) => (s.match(/\{\w+\}/g) || []).sort();
const dic = unirTextos(textosApp, MODOS);

prueba('textos: español e inglés tienen las mismas claves (app y modos)', () => {
  const es = Object.keys(dic.es).sort(), en = Object.keys(dic.en).sort();
  igual(en, es);
});

prueba('textos: ninguno está vacío y las marcas {n} coinciden entre idiomas', () => {
  for (const [clave, texto] of Object.entries(dic.es)) {
    verdad(texto.trim() !== '' && dic.en[clave].trim() !== '', `vacío: ${clave}`);
    igual(marcas(dic.en[clave]), marcas(texto), `marcas distintas en ${clave}:`);
  }
});

prueba('textos: traducir interpola, cae al español y delata claves que faltan', () => {
  igual(interpolar('hace {n} días', { n: 3 }), 'hace 3 días');
  igual(interpolar('hola {x}', {}), 'hola {x}');
  igual(traducir({ es: { a: 'uno' }, en: {} }, 'en', 'a'), 'uno');
  igual(traducir({ es: {}, en: {} }, 'en', 'falta'), 'falta');
  igual(traducir({ es: { a: '{n} min' }, en: { a: '{n} mins' } }, 'en', 'a', { n: 2 }), '2 mins');
});

prueba('idioma de arranque: el elegido manda; si no, el del navegador; si no, español', () => {
  igual(idiomaInicial('en', 'es-AR'), 'en');
  igual(idiomaInicial(undefined, 'en-US'), 'en');
  igual(idiomaInicial(undefined, 'es-AR'), 'es');
  igual(idiomaInicial('fr', 'fr-FR'), 'es');
  igual(idiomaInicial(undefined, undefined), 'es');
  igual(IDIOMAS.map((i) => i.id), ['es', 'en']);
});

prueba('registro de modos: ids únicos, familia válida, con tono y con textos completos', () => {
  const ids = MODOS.map((m) => m.id);
  igual(new Set(ids).size, ids.length, 'ids repetidos:');
  for (const m of MODOS) {
    verdad(FAMILIAS.includes(m.familia), `familia inválida en ${m.id}`);
    verdad(TONO_FAMILIA[m.familia], `falta tono de ${m.familia}`);
    verdad(typeof m.montar === 'function' && typeof m.desmontar === 'function', `${m.id} sin montar/desmontar`);
    verdad(Number.isFinite(m.minutos) && m.minutos > 0, `${m.id} sin minutos`);
    for (const { id } of IDIOMAS) verdad(m.textos[id]?.nombre && m.textos[id]?.linea, `${m.id} sin nombre/línea en ${id}`);
  }
});
