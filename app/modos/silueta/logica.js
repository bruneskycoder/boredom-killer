// Silueta: lógica pura. Se muestra la forma de un país y se elige entre cuatro nombres.
import { cajaDe } from '../donde-queda/geo.js';

export const RONDA = 10;
export const OPCIONES = 4;
const EXCLUIDOS = new Set(['ATA', 'ATF']); // Antártida y tierras australes: no se reconocen por la forma
const SUPERFICIE_MINIMA = 4; // grados cuadrados de caja: más chico que eso es un punto en el mapa de 110 m

const area = (a) => { const c = cajaDe([a]); return (c.lonMax - c.lonMin) * (c.latMax - c.latMin); };

// Un país con islas lejanas (Francia con la Guayana, EE. UU. con Hawái) quedaría diminuto: se dibuja la parte principal,
// o sea el anillo más grande y los que están cerca de él.
export function anillosPrincipales(anillos) {
  if (anillos.length <= 1) return anillos;
  const mayor = anillos.reduce((m, a) => (area(a) > area(m) ? a : m));
  const c = cajaDe([mayor]);
  const ex = (c.lonMax - c.lonMin) * 0.6, ey = (c.latMax - c.latMin) * 0.6;
  return anillos.filter((a) => {
    const b = cajaDe([a]);
    return b.lonMax >= c.lonMin - ex && b.lonMin <= c.lonMax + ex && b.latMax >= c.latMin - ey && b.latMin <= c.latMax + ey;
  });
}

// Países que sirven como pregunta: ni excluidos ni diminutos.
export function candidatos(paises) {
  return paises.filter((p) => !EXCLUIDOS.has(p.id) && area(anillosPrincipalesGrande(p.anillos)) >= SUPERFICIE_MINIMA);
}
const anillosPrincipalesGrande = (anillos) => anillos.reduce((m, a) => (area(a) > area(m) ? a : m));

function mezclar(lista, azar) {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

export function elegirRonda(paises, n = RONDA, azar = Math.random) {
  return mezclar(candidatos(paises), azar).slice(0, n);
}

// El correcto más (k - 1) distractores distintos, en orden al azar. Los nombres no se repiten.
export function opciones(correcto, paises, k = OPCIONES, azar = Math.random) {
  const otros = mezclar(paises.filter((p) => p.id !== correcto.id && p.nombre !== correcto.nombre), azar).slice(0, k - 1);
  return mezclar([correcto, ...otros], azar);
}
