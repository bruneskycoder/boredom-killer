// Inglés: lógica pura (sin pantalla) para poder probarla. Repetición espaciada SM-2 propia, prueba de nivel y dictado.

export const NIVELES = ['A1', 'A2', 'B1', 'B2'];
export const TAMANO_PRUEBA = 30;
export const NUEVAS_POR_DIA = 10;
export const MAX_REPASOS = 30;
export const UMBRAL_NIVEL = 0.6;
export const DIAS_SABIDA = 30; // una palabra que dijiste saber en la prueba vuelve a aparecer en 30 días, para confirmar

const idx = (nivel) => NIVELES.indexOf(nivel);

// El vocabulario trae una fila por palabra y categoría ("about" aparece varias veces). Acá queda una por palabra:
// el nivel más bajo en que aparece y las oraciones de todas sus filas. Se descartan las que no tienen oración (no hay con qué estudiarlas).
export function prepararVocab(filas) {
  const por = new Map();
  for (const [palabra, categoria, nivel, ids] of filas) {
    const p = por.get(palabra);
    if (!p) por.set(palabra, { palabra, categoria, nivel, ids: [...ids] });
    else {
      if (idx(nivel) < idx(p.nivel)) { p.nivel = nivel; p.categoria = categoria; }
      for (const id of ids) if (!p.ids.includes(id)) p.ids.push(id);
    }
  }
  return [...por.values()].filter((p) => p.ids.length > 0);
}

// Fechas como texto AAAA-MM-DD, sumadas en días (sin líos de zona horaria ni horario de verano).
export function sumarDias(dia, n) {
  const [y, m, d] = dia.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

export function diasEntre(a, b) {
  const t = (d) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y, m - 1, dd); };
  return Math.round((t(b) - t(a)) / 86400000);
}

// SM-2. calidad: 0-2 no la sabía, 3 difícil, 4 la sabía, 5 fácil.
// Estado: { ef: facilidad (mín. 1,3), rep: aciertos seguidos, int: intervalo en días, vence: día en que vuelve }.
export function sm2(estado, calidad, hoy) {
  let { ef = 2.5, rep = 0, int = 0 } = estado || {};
  if (calidad < 3) {
    rep = 0;
    int = 1;
  } else {
    int = rep === 0 ? 1 : rep === 1 ? 6 : Math.round(int * ef);
    rep += 1;
  }
  ef = Math.max(1.3, ef + 0.1 - (5 - calidad) * (0.08 + (5 - calidad) * 0.02));
  return { ef: Math.round(ef * 100) / 100, rep, int, vence: sumarDias(hoy, int) };
}

// ---- Prueba de nivel ----

// 30 palabras repartidas parejo entre los cuatro niveles (8, 8, 7, 7), al azar dentro de cada uno.
export function elegirMuestra(vocab, azar = Math.random, n = TAMANO_PRUEBA) {
  const base = Math.floor(n / NIVELES.length), extra = n % NIVELES.length;
  const salida = [];
  NIVELES.forEach((nivel, i) => {
    const pool = vocab.filter((v) => v.nivel === nivel);
    for (let k = pool.length - 1; k > 0; k--) {
      const j = Math.floor(azar() * (k + 1));
      [pool[k], pool[j]] = [pool[j], pool[k]];
    }
    salida.push(...pool.slice(0, base + (i < extra ? 1 : 0)));
  });
  return salida;
}

// respuestas: [{ nivel, sabe }]. El nivel es el último que se domina de corrido (≥ 60 % de sabidas);
// se corta en el primero que no llega. Si ni A1 llega, se empieza por A1.
export function ubicarNivel(respuestas, umbral = UMBRAL_NIVEL) {
  let ubicado = NIVELES[0];
  for (const nivel of NIVELES) {
    const r = respuestas.filter((x) => x.nivel === nivel);
    if (!r.length) break;
    if (r.filter((x) => x.sabe).length / r.length >= umbral) ubicado = nivel;
    else break;
  }
  return ubicado;
}

// Después de la prueba: las sabidas quedan "confirmadas" a 30 días; las que no, quedan pendientes (se estudian primero).
export function sembrarPrueba(respuestas, hoy) {
  const estados = {}, pendientes = [];
  for (const { palabra, sabe } of respuestas) {
    if (sabe) estados[palabra] = { ef: 2.5, rep: 2, int: DIAS_SABIDA, vence: sumarDias(hoy, DIAS_SABIDA) };
    else pendientes.push(palabra);
  }
  return { estados, pendientes };
}

// ---- Cola del día ----

// Repasos vencidos (los más atrasados primero) y después palabras nuevas hasta el tope diario:
// primero las pendientes de la prueba, después las del nivel ubicado hacia arriba, al azar dentro de cada nivel.
export function construirCola({ estados, vocab, hoy, nivel, pendientes = [], nuevasHoy = 0, azar = Math.random }) {
  const repasos = Object.entries(estados)
    .filter(([, e]) => e.vence <= hoy)
    .sort((a, b) => (a[1].vence < b[1].vence ? -1 : a[1].vence > b[1].vence ? 1 : 0))
    .slice(0, MAX_REPASOS)
    .map(([palabra]) => ({ palabra, tipo: 'repaso' }));

  const cupo = Math.max(0, NUEVAS_POR_DIA - nuevasHoy);
  const conocida = new Set(vocab.map((v) => v.palabra));
  const nuevas = [];
  const ya = new Set(Object.keys(estados));
  for (const p of pendientes) if (nuevas.length < cupo && !ya.has(p) && conocida.has(p)) { nuevas.push({ palabra: p, tipo: 'nueva' }); ya.add(p); }
  for (let i = Math.max(0, idx(nivel)); i < NIVELES.length && nuevas.length < cupo; i++) {
    const pool = vocab.filter((v) => v.nivel === NIVELES[i] && !ya.has(v.palabra));
    for (let k = pool.length - 1; k > 0; k--) {
      const j = Math.floor(azar() * (k + 1));
      [pool[k], pool[j]] = [pool[j], pool[k]];
    }
    for (const v of pool) { if (nuevas.length >= cupo) break; nuevas.push({ palabra: v.palabra, tipo: 'nueva' }); ya.add(v.palabra); }
  }
  return [...repasos, ...nuevas];
}

export function cuantasVencen(estados, hoy) {
  return Object.values(estados).filter((e) => e.vence <= hoy).length;
}

// ---- Tarjeta y dictado ----

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Parte la oración en [antes, la palabra tal como aparece, después] para resaltarla. Si no está, devuelve null.
export function resaltar(oracion, palabra) {
  const m = new RegExp(`(^|[^A-Za-z'])(${escapar(palabra)})(?![A-Za-z'])`, 'i').exec(oracion);
  if (!m) return null;
  const ini = m.index + m[1].length;
  return [oracion.slice(0, ini), m[2], oracion.slice(ini + m[2].length)];
}

export function palabrasDe(texto) {
  return (String(texto).toLowerCase().normalize('NFC').replace(/[’‘]/g, "'").match(/[a-z0-9áéíóúüñ]+(?:'[a-z]+)?/g)) || [];
}

// Compara lo escuchado con lo escrito palabra por palabra (sin mayúsculas ni puntuación), alineando con la subsecuencia
// común más larga: una palabra de más o de menos no arruina el resto. Devuelve cada palabra esperada con ok/no y la precisión.
export function compararDictado(esperado, escrito) {
  const a = palabrasDe(esperado), b = palabrasDe(escrito);
  const t = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  }
  const ok = new Array(a.length).fill(false);
  for (let i = 0, j = 0; i < a.length && j < b.length;) {
    if (a[i] === b[j]) { ok[i] = true; i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) i++;
    else j++;
  }
  return {
    palabras: a.map((palabra, i) => ({ palabra, ok: ok[i] })),
    sobran: Math.max(0, b.length - ok.filter(Boolean).length),
    precision: a.length ? ok.filter(Boolean).length / a.length : 0,
  };
}
