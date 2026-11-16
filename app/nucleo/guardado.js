// Guardado: todo el estado vive en UN documento (ajustes, partidas abiertas, historial).
// Un solo documento hace trivial exportar, importar y, más adelante, sincronizar.
// La lógica no sabe dónde se guarda: recibe un "almacén" con leer() y escribir(doc).
// En la app el almacén es IndexedDB; en las pruebas, memoria.

export const FORMATO = 'boredom-killer';
export const VERSION = 1;
export const DIAS_AVISO = 14;
export const MAX_HISTORIAL = 5000;

const PROHIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);
const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Copia profunda de datos JSON que descarta claves que podrían envenenar el prototipo (viene de archivos ajenos).
function copiar(origen) {
  if (Array.isArray(origen)) return origen.map(copiar);
  if (esObjeto(origen)) {
    const o = {};
    for (const [k, v] of Object.entries(origen)) if (!PROHIBIDAS.has(k)) o[k] = copiar(v);
    return o;
  }
  return origen;
}

export const estadoVacio = () => ({ ajustes: {}, partidas: {}, historial: [], ultimoExport: null });

// Devuelve el estado limpio o null si el documento no tiene la forma esperada.
export function limpiarEstado(d) {
  if (!esObjeto(d)) return null;
  const { ajustes, partidas, historial, ultimoExport } = d;
  if (!esObjeto(ajustes) || !esObjeto(partidas) || !Array.isArray(historial)) return null;
  if (!historial.every((h) => esObjeto(h) && typeof h.modo === 'string')) return null;
  if (ultimoExport != null && !Number.isFinite(ultimoExport)) return null;
  return copiar({ ajustes, partidas, historial, ultimoExport: ultimoExport ?? null });
}

// Lee un archivo de exportación (texto u objeto). Devuelve { ok, estado } o { ok:false, error }.
// Errores: 'json' (no es JSON), 'formato' (no es de esta app), 'version' (de una app más nueva), 'datos' (dañado).
export function leerExport(entrada) {
  let obj = entrada;
  if (typeof entrada === 'string') {
    try { obj = JSON.parse(entrada); } catch { return { ok: false, error: 'json' }; }
  }
  if (!esObjeto(obj) || obj.formato !== FORMATO || !Number.isInteger(obj.version)) return { ok: false, error: 'formato' };
  if (obj.version > VERSION) return { ok: false, error: 'version' };
  const estado = limpiarEstado(obj.datos);
  return estado ? { ok: true, estado } : { ok: false, error: 'datos' };
}

const hayDatos = (e) => e.historial.length > 0 || Object.keys(e.partidas).length > 0;

// Cuándo avisar que exporte. null = no hace falta (sin datos o export reciente).
// { nunca: true } = hay datos y jamás exportó. { dias: n } = pasaron n días o más desde el último export.
export function avisoExportar(estado, ahora) {
  if (!hayDatos(estado)) return null;
  if (estado.ultimoExport == null) return { nunca: true };
  const dias = Math.floor((ahora - estado.ultimoExport) / 86400000);
  return dias >= DIAS_AVISO ? { dias } : null;
}

export function almacenMemoria() {
  let doc = null;
  return { async leer() { return doc; }, async escribir(d) { doc = copiar(d); } };
}

export function almacenIDB(nombre = 'boredom-killer') {
  let conexion = null;
  const abrir = () => new Promise((ok, mal) => {
    const r = indexedDB.open(nombre, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('doc');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });
  const pedir = (modo, hacer) => (conexion ||= abrir()).then((db) => new Promise((ok, mal) => {
    const tx = db.transaction('doc', modo);
    const req = hacer(tx.objectStore('doc'));
    tx.oncomplete = () => ok(req.result);
    tx.onerror = tx.onabort = () => mal(tx.error);
  }));
  return {
    leer: () => pedir('readonly', (s) => s.get('estado')),
    escribir: (d) => pedir('readwrite', (s) => s.put(d, 'estado')),
  };
}

export async function crearGuardado(almacen, { ahora = Date.now } = {}) {
  let persistente = true;
  let estado;
  try {
    estado = limpiarEstado(await almacen.leer()) ?? estadoVacio();
  } catch {
    estado = estadoVacio();
    persistente = false; // el navegador no deja guardar: se sigue en memoria
  }

  // Las escrituras van en fila: la última siempre queda al final, aunque se pidan varias seguidas.
  let cola = Promise.resolve();
  const persistir = () => {
    const copia = copiar(estado);
    cola = cola.then(() => almacen.escribir(copia)).catch(() => { persistente = false; });
    return cola;
  };

  const api = {
    get persistente() { return persistente; },
    get ultimoExport() { return estado.ultimoExport; },
    listo: () => cola,

    ajuste: (clave, defecto) => (clave in estado.ajustes ? estado.ajustes[clave] : defecto),
    fijarAjuste(clave, valor) { estado.ajustes[clave] = valor; return persistir(); },

    partida: (modo) => (modo in estado.partidas ? copiar(estado.partidas[modo]) : null),
    guardarPartida(modo, valor) { estado.partidas[modo] = copiar(valor); return persistir(); },
    borrarPartida(modo) { delete estado.partidas[modo]; return persistir(); },

    // Un resultado cerrado (fin de partida, ronda, tarjeta repasada): { ...datos del modo } + modo y cuándo.
    anotar(modo, resultado = {}) {
      estado.historial.push({ ...copiar(resultado), modo, cuando: ahora() });
      if (estado.historial.length > MAX_HISTORIAL) estado.historial.splice(0, estado.historial.length - MAX_HISTORIAL);
      return persistir();
    },
    historial: (modo) => copiar(modo ? estado.historial.filter((h) => h.modo === modo) : estado.historial),

    aviso: () => avisoExportar(estado, ahora()),

    // Arma el archivo de exportación y anota la fecha. Descargarlo es cosa de quien llama.
    exportar() {
      estado.ultimoExport = ahora();
      persistir();
      return { formato: FORMATO, version: VERSION, exportadoEn: estado.ultimoExport, datos: copiar(estado) };
    },
    // Reemplaza todo lo guardado. Si el archivo no sirve, no toca nada.
    importar(entrada) {
      const r = leerExport(entrada);
      if (!r.ok) return r;
      estado = r.estado;
      persistir();
      return { ok: true };
    },

    // Lo que ve un modo: solo su partida y su historial. Nunca el documento entero.
    paraModo: (id) => ({
      leer: () => api.partida(id),
      escribir: (valor) => api.guardarPartida(id, valor),
      borrar: () => api.borrarPartida(id),
      anotar: (resultado) => api.anotar(id, resultado),
      historial: () => api.historial(id),
    }),
  };
  return api;
}

// Abre el guardado real: IndexedDB si existe; si no, memoria.
export function abrirGuardado() {
  return crearGuardado(globalThis.indexedDB ? almacenIDB() : almacenMemoria());
}
