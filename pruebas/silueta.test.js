import { prueba, igual, verdad } from './corredor.js';
import { anillosPrincipales, candidatos, elegirRonda, opciones, OPCIONES, RONDA } from '../app/modos/silueta/logica.js';

const cuadro = (x, y, w, h) => [x, y, x + w, y, x + w, y + h, x, y + h, x, y];
const pais = (id, anillos, nombre = id) => ({ id, nombre, anillos });
const GRANDE = [cuadro(0, 0, 10, 10)];
const muchos = Array.from({ length: 20 }, (_, i) => pais(`P${i}`, GRANDE, `País ${i}`));

prueba('silueta: se queda con el anillo grande y los cercanos, y deja las islas lejanas', () => {
  const principal = cuadro(0, 0, 10, 10), cerca = cuadro(11, 2, 1, 1), lejos = cuadro(80, 50, 2, 2);
  const r = anillosPrincipales([principal, cerca, lejos]);
  igual(r.length, 2);
  verdad(r.includes(principal) && r.includes(cerca) && !r.includes(lejos));
  igual(anillosPrincipales([principal]).length, 1);
});

prueba('silueta: no pregunta países excluidos ni diminutos', () => {
  const lista = [pais('ARG', GRANDE), pais('ATA', GRANDE), pais('MLT', [cuadro(14, 35, 0.3, 0.2)])];
  igual(candidatos(lista).map((p) => p.id), ['ARG']);
});

prueba('silueta: la ronda trae 10 países distintos', () => {
  const r = elegirRonda(muchos);
  igual(r.length, RONDA);
  igual(new Set(r.map((p) => p.id)).size, RONDA);
  igual(elegirRonda(muchos.slice(0, 4)).length, 4, 'si hay menos, trae los que hay');
});

prueba('silueta: las opciones incluyen al correcto, son 4 y no se repiten', () => {
  for (let i = 0; i < 30; i++) {
    const c = muchos[i % 20];
    const o = opciones(c, muchos);
    igual(o.length, OPCIONES);
    verdad(o.some((p) => p.id === c.id), 'falta el correcto');
    igual(new Set(o.map((p) => p.nombre)).size, OPCIONES);
  }
});

prueba('silueta: la posición del correcto cambia (no es siempre la misma)', () => {
  const posiciones = new Set();
  for (let i = 0; i < 60; i++) posiciones.add(opciones(muchos[0], muchos).findIndex((p) => p.id === 'P0'));
  verdad(posiciones.size >= 3, `solo apareció en ${posiciones.size} posiciones`);
});
