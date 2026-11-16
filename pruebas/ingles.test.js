import { prueba, igual, verdad } from './corredor.js';
import { NIVELES, prepararVocab, sumarDias, diasEntre, sm2, elegirMuestra, ubicarNivel, sembrarPrueba, construirCola, cuantasVencen, resaltar, compararDictado, NUEVAS_POR_DIA, MAX_REPASOS, DIAS_SABIDA } from '../app/modos/ingles/logica.js';

const HOY = '2026-11-17';
const mk = (n, nivel, pre = 'p') => Array.from({ length: n }, (_, i) => [`${pre}${nivel}${i}`, 'noun', nivel, [`id${nivel}${i}`]]);

prueba('fechas: sumar días cruza mes, año y bisiesto', () => {
  igual(sumarDias('2026-11-17', 1), '2026-11-18');
  igual(sumarDias('2026-11-30', 1), '2026-12-01');
  igual(sumarDias('2026-12-31', 1), '2027-01-01');
  igual(sumarDias('2028-02-28', 1), '2028-02-29');
  igual(sumarDias('2026-11-17', 30), '2026-12-17');
  igual(sumarDias('2026-03-01', -1), '2026-02-28');
});

prueba('fechas: diferencia en días', () => {
  igual(diasEntre('2026-11-17', '2026-11-20'), 3);
  igual(diasEntre('2026-12-30', '2027-01-02'), 3);
  igual(diasEntre('2026-11-20', '2026-11-17'), -3);
});

prueba('SM-2: la primera vez que se sabe vuelve a los 1 día, después a los 6, después crece por la facilidad', () => {
  let e = sm2(null, 4, HOY);
  igual([e.rep, e.int, e.vence], [1, 1, '2026-11-18']);
  e = sm2(e, 4, '2026-11-18');
  igual([e.rep, e.int, e.vence], [2, 6, '2026-11-24']);
  const antes = e.ef;
  e = sm2(e, 4, '2026-11-24');
  igual(e.int, Math.round(6 * antes));
  igual(e.rep, 3);
});

prueba('SM-2: fallar reinicia las repeticiones, vuelve mañana y baja la facilidad', () => {
  const e = sm2({ ef: 2.5, rep: 5, int: 40, vence: HOY }, 1, HOY);
  igual([e.rep, e.int, e.vence], [0, 1, '2026-11-18']);
  verdad(e.ef < 2.5, 'la facilidad debía bajar');
});

prueba('SM-2: la facilidad nunca baja de 1,3 y "fácil" la sube', () => {
  let e = { ef: 1.35, rep: 1, int: 1, vence: HOY };
  for (let i = 0; i < 5; i++) e = sm2(e, 0, HOY);
  igual(e.ef, 1.3);
  const f = sm2({ ef: 2.5, rep: 1, int: 1, vence: HOY }, 5, HOY);
  igual(f.ef, 2.6);
  igual(sm2({ ef: 2.5, rep: 1, int: 1, vence: HOY }, 4, HOY).ef, 2.5, '"la sabía" deja la facilidad igual');
});

prueba('SM-2: las tarjetas vencidas vuelven el día que corresponde, ni antes ni después', () => {
  const e = sm2(null, 4, HOY); // vence mañana
  const estados = { casa: e };
  const vocab = [];
  igual(construirCola({ estados, vocab, hoy: HOY, nivel: 'A1' }).length, 0, 'hoy no toca');
  igual(construirCola({ estados, vocab, hoy: '2026-11-18', nivel: 'A1' }).map((x) => x.palabra), ['casa'], 'mañana sí');
  igual(construirCola({ estados, vocab, hoy: '2026-11-25', nivel: 'A1' }).map((x) => x.palabra), ['casa'], 'atrasada, también');
  igual(cuantasVencen(estados, HOY), 0);
  igual(cuantasVencen(estados, '2026-11-18'), 1);
});

prueba('vocabulario: una fila por palabra, el nivel más bajo, sin las que no tienen oración', () => {
  const v = prepararVocab([['about', 'adverb', 'B1', ['1']], ['about', 'preposition', 'A1', ['2', '1']], ['sin', 'noun', 'A1', []], ['casa', 'noun', 'A2', ['3']]]);
  igual(v.map((x) => x.palabra), ['about', 'casa']);
  igual(v[0].nivel, 'A1');
  igual(v[0].ids, ['1', '2']);
});

prueba('prueba de nivel: 30 palabras, 8-8-7-7, sin repetir', () => {
  const vocab = prepararVocab([...mk(50, 'A1'), ...mk(50, 'A2'), ...mk(50, 'B1'), ...mk(50, 'B2')]);
  const m = elegirMuestra(vocab);
  igual(m.length, 30);
  igual(new Set(m.map((x) => x.palabra)).size, 30);
  igual(NIVELES.map((n) => m.filter((x) => x.nivel === n).length), [8, 8, 7, 7]);
});

prueba('prueba de nivel: si falta vocabulario de un nivel, no se rompe', () => {
  const vocab = prepararVocab([...mk(3, 'A1'), ...mk(50, 'A2')]);
  verdad(elegirMuestra(vocab).length >= 11);
});

prueba('ubicar nivel: último nivel dominado de corrido', () => {
  const r = (a1, a2, b1, b2, de = 8) => [['A1', a1], ['A2', a2], ['B1', b1], ['B2', b2]].flatMap(([nivel, k]) => Array.from({ length: de }, (_, i) => ({ nivel, sabe: i < k })));
  igual(ubicarNivel(r(8, 8, 8, 8)), 'B2');
  igual(ubicarNivel(r(8, 8, 5, 2)), 'B1', 'B1 con 5/8 = 62 % llega; B2 con 2/8 no');
});

prueba('ubicar nivel: se corta en el primer nivel que no llega al 60 %', () => {
  const r = (a1, a2, b1, b2, de = 10) => [['A1', a1], ['A2', a2], ['B1', b1], ['B2', b2]].flatMap(([nivel, k]) => Array.from({ length: de }, (_, i) => ({ nivel, sabe: i < k })));
  igual(ubicarNivel(r(10, 10, 6, 0)), 'B1', '6/10 = 60 % llega');
  igual(ubicarNivel(r(10, 10, 5, 10)), 'A2', 'B1 con 50 % corta; que B2 salga bien no cuenta');
  igual(ubicarNivel(r(5, 10, 10, 10)), 'A1', 'si ni A1 llega, se empieza por A1');
  igual(ubicarNivel([]), 'A1');
});

prueba('sembrar la prueba: las sabidas se confirman a 30 días; las no sabidas quedan pendientes', () => {
  const { estados, pendientes } = sembrarPrueba([{ palabra: 'casa', sabe: true }, { palabra: 'perro', sabe: false }], HOY);
  igual(estados.casa.vence, sumarDias(HOY, DIAS_SABIDA));
  igual(estados.perro, undefined);
  igual(pendientes, ['perro']);
});

prueba('cola del día: tope de nuevas, pendientes primero, nunca repite lo que ya tiene estado', () => {
  const vocab = prepararVocab([...mk(40, 'A1'), ...mk(40, 'A2')]);
  const estados = { pA10: { ef: 2.5, rep: 1, int: 1, vence: '2026-12-31' } };
  const c = construirCola({ estados, vocab, hoy: HOY, nivel: 'A1', pendientes: ['pA25', 'pA10'] });
  igual(c.length, NUEVAS_POR_DIA);
  igual(c[0], { palabra: 'pA25', tipo: 'nueva' }, 'la pendiente va primero');
  verdad(!c.some((x) => x.palabra === 'pA10'), 'ya tiene estado');
  igual(new Set(c.map((x) => x.palabra)).size, c.length);
});

prueba('cola del día: lo ya visto hoy descuenta del cupo y el nivel ubicado manda', () => {
  const vocab = prepararVocab([...mk(40, 'A1'), ...mk(40, 'B1')]);
  igual(construirCola({ estados: {}, vocab, hoy: HOY, nivel: 'B1', nuevasHoy: 7 }).length, NUEVAS_POR_DIA - 7);
  igual(construirCola({ estados: {}, vocab, hoy: HOY, nivel: 'B1', nuevasHoy: 10 }).length, 0);
  const c = construirCola({ estados: {}, vocab, hoy: HOY, nivel: 'B1' });
  verdad(c.every((x) => x.palabra.startsWith('pB1')), 'desde B1 hacia arriba, no A1');
});

prueba('cola del día: repasos primero, los más atrasados al frente, con tope', () => {
  const estados = {};
  for (let i = 0; i < 40; i++) estados[`w${i}`] = { ef: 2.5, rep: 1, int: 1, vence: sumarDias('2026-10-01', i) };
  const c = construirCola({ estados, vocab: [], hoy: HOY, nivel: 'A1' });
  igual(c.length, MAX_REPASOS);
  igual(c[0].palabra, 'w0');
  verdad(c.every((x) => x.tipo === 'repaso'));
});

prueba('resaltar: encuentra la palabra entera, sin importar mayúsculas, y no confunde partes de otra', () => {
  igual(resaltar('We must abandon ship.', 'abandon'), ['We must ', 'abandon', ' ship.']);
  igual(resaltar('Abandon hope.', 'abandon'), ['', 'Abandon', ' hope.']);
  igual(resaltar('He is a cat.', 'at'), null, '"at" no está dentro de "cat"');
  igual(resaltar("It's a dog's life", "dog's"), ["It's a ", "dog's", ' life']);
});

prueba('dictado: todo bien es 100 %, sin importar mayúsculas ni puntuación', () => {
  const r = compararDictado('We must abandon ship.', 'we MUST abandon ship');
  igual(r.precision, 1);
  verdad(r.palabras.every((p) => p.ok));
});

prueba('dictado: una palabra mal no arruina el resto', () => {
  const r = compararDictado('We must abandon ship now', 'we must abandom ship now');
  igual(r.palabras.map((p) => p.ok), [true, true, false, true, true]);
  igual(r.precision, 0.8);
});

prueba('dictado: una palabra de más o de menos se alinea', () => {
  const de_menos = compararDictado('the quick brown fox', 'the brown fox');
  igual(de_menos.palabras.map((p) => p.ok), [true, false, true, true]);
  const de_mas = compararDictado('the brown fox', 'the very brown fox');
  igual(de_mas.palabras.map((p) => p.ok), [true, true, true]);
  igual(de_mas.sobran, 1);
});

prueba('dictado: vacío y apóstrofes', () => {
  igual(compararDictado('Hello there', '').precision, 0);
  igual(compararDictado("I don't know", 'i don’t know').precision, 1, 'apóstrofe curvo = recto');
  igual(compararDictado('', 'algo').precision, 0);
});
