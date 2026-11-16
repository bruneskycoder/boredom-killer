// Dónde queda: geografía pura (proyección, vista, distancia, puntaje). Sin pantalla, para poder probarla.
//
// Proyección equirectangular centrada: u = (lon - lon0) · cos(lat0), v = lat. Es plana y simple;
// para un mapa mudo de un país alcanza, y la inversa es exacta (hace falta para convertir un toque en coordenadas).
// "Vista" = qué parte del plano (u, v) se ve en el lienzo: centro (cu, cv) y escala s (píxeles por grado).

const RAD = Math.PI / 180;
export const RADIO_TIERRA_KM = 6371;

export function distanciaKm(lon1, lat1, lon2, lat2) {
  const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// 1000 puntos en el lugar exacto; cae de forma exponencial: a "escala" km de error quedan unos 368.
// La escala es de cada lámina (un error de 300 km pesa distinto en el mundo que en Nueva Zelanda).
export function puntaje(km, escala) {
  return Math.round(1000 * Math.exp(-Math.max(0, km) / escala));
}

// Caja que contiene todos los anillos ([lon, lat, lon, lat, ...]).
export function cajaDe(anillos) {
  const c = { lonMin: Infinity, latMin: Infinity, lonMax: -Infinity, latMax: -Infinity };
  for (const a of anillos) {
    for (let i = 0; i < a.length; i += 2) {
      c.lonMin = Math.min(c.lonMin, a[i]); c.lonMax = Math.max(c.lonMax, a[i]);
      c.latMin = Math.min(c.latMin, a[i + 1]); c.latMax = Math.max(c.latMax, a[i + 1]);
    }
  }
  return c;
}

export function proyeccion(caja) {
  return { lon0: (caja.lonMin + caja.lonMax) / 2, c: Math.cos(((caja.latMin + caja.latMax) / 2) * RAD) };
}
export const proyectar = (lon, lat, P) => [(lon - P.lon0) * P.c, lat];
export const desproyectar = (u, v, P) => [u / P.c + P.lon0, v];

export const aPantalla = (u, v, V) => [(u - V.cu) * V.s + V.ancho / 2, (V.cv - v) * V.s + V.alto / 2];
export const dePantalla = (px, py, V) => [(px - V.ancho / 2) / V.s + V.cu, V.cv - (py - V.alto / 2) / V.s];

// Vista que muestra la caja entera con un margen.
export function encuadre(caja, P, ancho, alto, margen = 0.94) {
  const [u0, v0] = proyectar(caja.lonMin, caja.latMin, P), [u1, v1] = proyectar(caja.lonMax, caja.latMax, P);
  const s = Math.min(ancho / (u1 - u0), alto / (v1 - v0)) * margen;
  return { cu: (u0 + u1) / 2, cv: (v0 + v1) / 2, s, sMin: s, sMax: s * 14, ancho, alto, limites: [u0, v0, u1, v1] };
}

// Zoom que deja quieto el punto del mapa que está bajo (px, py): lo que se pellizca no se corre.
export function zoomEn(V, px, py, factor) {
  const [u, v] = dePantalla(px, py, V);
  const s = Math.min(V.sMax, Math.max(V.sMin, V.s * factor));
  return acotar({ ...V, s, cu: u - (px - V.ancho / 2) / s, cv: v + (py - V.alto / 2) / s });
}

export function mover(V, dx, dy) {
  return acotar({ ...V, cu: V.cu - dx / V.s, cv: V.cv + dy / V.s });
}

// El centro no sale de la caja del mapa: no se puede perder el mapa de vista.
function acotar(V) {
  const [u0, v0, u1, v1] = V.limites;
  return { ...V, cu: Math.min(u1, Math.max(u0, V.cu)), cv: Math.min(v1, Math.max(v0, V.cv)) };
}

// n objetivos distintos al azar (azar() devuelve un número en [0, 1), se puede inyectar para probar).
export function elegir(lista, n, azar = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, Math.min(n, copia.length));
}
