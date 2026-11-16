import { prueba, igual, verdad } from './corredor.js';
import { normalizar, puntuar, estadosTeclas, palabraDelDia, calcularRacha, fechaLocal } from '../app/modos/palabra/logica.js';

const A = 'acierto', C = 'casi', F = 'fallo';

prueba('puntaje: todo acierto, todo fallo y mezcla simple', () => {
  igual(puntuar('mesas', 'mesas'), [A, A, A, A, A]);
  igual(puntuar('quito', 'mesas'), [F, F, F, F, F]);
  igual(puntuar('perro', 'mesas'), [F, A, F, F, F]);
});

prueba('puntaje: dos letras iguales en el intento y una sola en la secreta', () => {
  // casas = c a s a s ; sosos: la s de la posición 3 y 5 aciertan, la primera s no tiene con qué
  igual(puntuar('sosos', 'casas'), [F, F, A, F, A]);
  igual(puntuar('eeeee', 'abeja'), [F, F, A, F, F]);
  igual(puntuar('aaaaa', 'abeja'), [A, F, F, F, A]);
  igual(puntuar('rrrrr', 'arbol'), [F, A, F, F, F]);
});

prueba('puntaje: dos letras iguales en la secreta se marcan las dos', () => {
  // gallo = g a l l o ; llano: las dos l son "casi", la a es "casi", la o acierta
  igual(puntuar('llano', 'gallo'), [C, C, C, F, A]);
});

prueba('puntaje: el acierto se reparte antes que los "casi" (de izquierda a derecha)', () => {
  // cabra = c a b r a ; abaca: la última a acierta, entonces la primera a es "casi" y la tercera no tiene con qué
  igual(puntuar('abaca', 'cabra'), [C, C, F, C, A]);
});

prueba('teclado: cada letra muestra su mejor estado', () => {
  const m = estadosTeclas(['mesas', 'perro'], 'perla');
  igual(m.e, 'acierto');
  igual(m.p, 'acierto');
  igual(m.r, 'acierto');
  igual(m.m, 'fallo');
  igual(m.s, 'fallo');
  igual(m.o, 'fallo');
  igual(m.a, 'casi');
});

prueba('normalizar: saca tildes y mayúsculas pero conserva la ñ', () => {
  igual(normalizar('ÁRBOL'), 'arbol');
  igual(normalizar('cigüeña'), 'cigueña');
  igual(normalizar('AÑEJO'), 'añejo');
  igual(normalizar('año'), 'año', 'ñ escrita como n + tilde combinada');
});

prueba('palabra del día: misma fecha, misma palabra; cambia con la fecha', () => {
  const lista = Array.from({ length: 751 }, (_, i) => `w${i}`);
  igual(palabraDelDia(lista, '2026-11-16'), palabraDelDia(lista, '2026-11-16'));
  const distintas = new Set(Array.from({ length: 30 }, (_, i) => palabraDelDia(lista, `2026-12-${String(i + 1).padStart(2, '0')}`)));
  verdad(distintas.size > 20, `30 días dieron ${distintas.size} palabras distintas`);
  verdad(lista.includes(palabraDelDia(lista, '2030-01-01')));
});

prueba('fecha local: formato AAAA-MM-DD', () => {
  igual(fechaLocal(new Date(2026, 0, 5)), '2026-01-05');
  igual(fechaLocal(new Date(2026, 11, 31)), '2026-12-31');
});

prueba('racha: cuenta días seguidos ganados', () => {
  const g = (dia, gano = true) => ({ dia, gano });
  igual(calcularRacha([], '2026-11-16'), 0);
  igual(calcularRacha([g('2026-11-16')], '2026-11-16'), 1);
  igual(calcularRacha([g('2026-11-14'), g('2026-11-15'), g('2026-11-16')], '2026-11-16'), 3);
});

prueba('racha: sigue viva si hoy no se jugó pero ayer sí; se corta si falta un día', () => {
  const g = (dia, gano = true) => ({ dia, gano });
  igual(calcularRacha([g('2026-11-14'), g('2026-11-15')], '2026-11-16'), 2);
  igual(calcularRacha([g('2026-11-13'), g('2026-11-15')], '2026-11-16'), 1);
  igual(calcularRacha([g('2026-11-13')], '2026-11-16'), 0);
  igual(calcularRacha([g('2026-11-15', false)], '2026-11-16'), 0, 'perder no suma');
});

prueba('racha: cruza el cambio de mes y de año', () => {
  const g = (dia) => ({ dia, gano: true });
  igual(calcularRacha([g('2026-12-30'), g('2026-12-31'), g('2027-01-01')], '2027-01-01'), 3);
  igual(calcularRacha([g('2028-02-28'), g('2028-02-29'), g('2028-03-01')], '2028-03-01'), 3);
});
