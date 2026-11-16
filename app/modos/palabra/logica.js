// Palabra de campo: lógica pura (sin pantalla), para poder probarla.

export const LARGO = 5;
export const INTENTOS = 6;

// Minúsculas y sin tildes, pero la ñ se conserva (es otra letra).
export function normalizar(texto) {
  return String(texto).normalize('NFC').toLowerCase()
    .replace(/ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ');
}

// Puntaje de un intento: 'acierto' (letra bien ubicada), 'casi' (está en otro lugar) o 'fallo'.
// Con letras repetidas, cada letra de la secreta se gasta una sola vez: primero los aciertos, después los "casi" de izquierda a derecha.
export function puntuar(intento, secreta) {
  const a = Array.from(intento), s = Array.from(secreta);
  const r = a.map(() => 'fallo');
  const resto = {};
  a.forEach((letra, i) => {
    if (letra === s[i]) r[i] = 'acierto';
    else resto[s[i]] = (resto[s[i]] || 0) + 1;
  });
  a.forEach((letra, i) => {
    if (r[i] !== 'acierto' && resto[letra] > 0) { r[i] = 'casi'; resto[letra]--; }
  });
  return r;
}

const PESO = { fallo: 1, casi: 2, acierto: 3 };

// Mejor estado conocido de cada letra para pintar el teclado.
export function estadosTeclas(intentos, secreta) {
  const m = {};
  for (const intento of intentos) {
    puntuar(intento, secreta).forEach((e, i) => {
      const letra = Array.from(intento)[i];
      if (!m[letra] || PESO[e] > PESO[m[letra]]) m[letra] = e;
    });
  }
  return m;
}

// Fecha local como texto AAAA-MM-DD (el día cambia a medianoche del dispositivo).
export function fechaLocal(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// La palabra del día sale de la fecha: misma fecha, misma palabra, sin servidor.
export function palabraDelDia(respuestas, dia) {
  let h = 2166136261; // FNV-1a
  for (const c of dia) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return respuestas[h % respuestas.length];
}

const aDias = (dia) => { const [y, m, d] = dia.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };

// Días seguidos ganados. Si hoy todavía no se jugó, la racha sigue viva si ayer se ganó.
export function calcularRacha(historial, hoy) {
  const ganados = new Set(historial.filter((h) => h.gano && typeof h.dia === 'string').map((h) => aDias(h.dia)));
  let dia = aDias(hoy);
  if (!ganados.has(dia)) dia--;
  let racha = 0;
  while (ganados.has(dia)) { racha++; dia--; }
  return racha;
}
