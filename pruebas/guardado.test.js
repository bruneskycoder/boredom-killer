import { prueba, igual, verdad } from './corredor.js';
import { crearGuardado, almacenMemoria, leerExport, avisoExportar, estadoVacio, FORMATO, VERSION, DIAS_AVISO, MAX_HISTORIAL } from '../app/nucleo/guardado.js';

const DIA = 86400000;
const nuevo = (almacen = almacenMemoria(), ahora = () => 1000) => crearGuardado(almacen, { ahora });

prueba('guardado: guarda y lee la partida abierta de un modo', async () => {
  const g = await nuevo();
  igual(g.partida('palabra'), null);
  await g.guardarPartida('palabra', { intentos: ['mesa'], dia: '2026-11-15' });
  igual(g.partida('palabra'), { intentos: ['mesa'], dia: '2026-11-15' });
  await g.borrarPartida('palabra');
  igual(g.partida('palabra'), null);
});

prueba('guardado: lo guardado sobrevive a cerrar y volver a abrir', async () => {
  const almacen = almacenMemoria();
  const a = await nuevo(almacen);
  await a.guardarPartida('palabra', { x: 1 });
  await a.anotar('palabra', { puntos: 5 });
  await a.fijarAjuste('idioma', 'en');
  await a.listo();
  const b = await nuevo(almacen);
  igual(b.partida('palabra'), { x: 1 });
  igual(b.historial('palabra').length, 1);
  igual(b.ajuste('idioma'), 'en');
});

prueba('guardado: ajuste devuelve el valor por defecto si no existe (incluso false)', async () => {
  const g = await nuevo();
  igual(g.ajuste('sonido', true), true);
  await g.fijarAjuste('sonido', false);
  igual(g.ajuste('sonido', true), false);
});

prueba('guardado: anota resultados con modo y fecha, y los separa por modo', async () => {
  const g = await nuevo(almacenMemoria(), () => 777);
  await g.anotar('palabra', { puntos: 3 });
  await g.anotar('ingles', { puntos: 9 });
  igual(g.historial('palabra'), [{ puntos: 3, modo: 'palabra', cuando: 777 }]);
  igual(g.historial().length, 2);
});

prueba('guardado: un resultado no puede pisar el modo ni la fecha', async () => {
  const g = await nuevo(almacenMemoria(), () => 5);
  await g.anotar('palabra', { modo: 'otro', cuando: 1 });
  igual(g.historial('palabra'), [{ modo: 'palabra', cuando: 5 }]);
});

prueba('guardado: el historial se recorta al tope y se pierden los más viejos', async () => {
  const g = await nuevo();
  for (let i = 0; i < MAX_HISTORIAL + 3; i++) g.anotar('palabra', { i });
  const h = g.historial();
  igual(h.length, MAX_HISTORIAL);
  igual(h[0].i, 3);
});

prueba('guardado: lo que ve un modo es solo lo suyo', async () => {
  const g = await nuevo();
  const a = g.paraModo('palabra'), b = g.paraModo('ingles');
  await a.escribir({ n: 1 });
  await a.anotar({ p: 1 });
  igual(b.leer(), null);
  igual(b.historial(), []);
  igual(a.leer(), { n: 1 });
  igual(a.historial().length, 1);
});

prueba('guardado: lo leído es una copia (cambiarla no toca lo guardado)', async () => {
  const g = await nuevo();
  await g.guardarPartida('palabra', { lista: [1] });
  g.partida('palabra').lista.push(2);
  igual(g.partida('palabra'), { lista: [1] });
});

prueba('guardado: varias escrituras seguidas dejan la última en el almacén', async () => {
  const almacen = almacenMemoria();
  const g = await nuevo(almacen);
  for (let i = 0; i < 20; i++) g.guardarPartida('palabra', { i });
  await g.listo();
  igual((await almacen.leer()).partidas.palabra, { i: 19 });
});

prueba('guardado: si el navegador no deja guardar, sigue andando en memoria y lo avisa', async () => {
  const roto = { async leer() { throw new Error('bloqueado'); }, async escribir() { throw new Error('bloqueado'); } };
  const g = await nuevo(roto);
  verdad(!g.persistente, 'debería avisar que no persiste');
  await g.guardarPartida('palabra', { x: 1 });
  igual(g.partida('palabra'), { x: 1 });
});

prueba('guardado: si falla solo la escritura, también lo avisa', async () => {
  const g = await nuevo({ async leer() { return null; }, async escribir() { throw new Error('lleno'); } });
  verdad(g.persistente);
  await g.guardarPartida('palabra', { x: 1 });
  await g.listo();
  verdad(!g.persistente);
});

prueba('guardado: un documento guardado dañado se ignora en vez de romper la app', async () => {
  const g = await nuevo({ async leer() { return { ajustes: 'mal' }; }, async escribir() {} });
  igual(g.historial(), []);
});

prueba('exportar e importar: ida y vuelta en otro dispositivo deja todo igual', async () => {
  const a = await nuevo(almacenMemoria(), () => 5 * DIA);
  await a.fijarAjuste('idioma', 'en');
  await a.guardarPartida('palabra', { intentos: ['mesa', 'perro'] });
  await a.anotar('ingles', { palabra: 'abandon', ok: true });
  const archivo = JSON.parse(JSON.stringify(a.exportar())); // como si pasara por un archivo
  igual(archivo.formato, FORMATO);
  igual(archivo.version, VERSION);
  const b = await nuevo(almacenMemoria(), () => 6 * DIA);
  const r = b.importar(JSON.stringify(archivo));
  verdad(r.ok, 'debería importar');
  igual(b.ajuste('idioma'), 'en');
  igual(b.partida('palabra'), { intentos: ['mesa', 'perro'] });
  igual(b.historial('ingles'), a.historial('ingles'));
  igual(b.ultimoExport, 5 * DIA);
});

prueba('importar reemplaza lo que había', async () => {
  const origen = await nuevo();
  await origen.guardarPartida('ingles', { a: 1 });
  const destino = await nuevo();
  await destino.guardarPartida('palabra', { b: 2 });
  destino.importar(origen.exportar());
  igual(destino.partida('palabra'), null);
  igual(destino.partida('ingles'), { a: 1 });
});

prueba('importar persiste: después de reabrir sigue lo importado', async () => {
  const origen = await nuevo();
  await origen.guardarPartida('ingles', { a: 1 });
  const almacen = almacenMemoria();
  const destino = await nuevo(almacen);
  destino.importar(origen.exportar());
  await destino.listo();
  igual((await nuevo(almacen)).partida('ingles'), { a: 1 });
});

prueba('importar rechaza lo que no sirve y no toca nada', async () => {
  const g = await nuevo();
  await g.guardarPartida('palabra', { x: 1 });
  const valido = { formato: FORMATO, version: VERSION, datos: estadoVacio() };
  const casos = [
    ['no es JSON', 'esto no es json {', 'json'],
    ['formato ajeno', { formato: 'otra-app', version: 1, datos: estadoVacio() }, 'formato'],
    ['sin versión', { formato: FORMATO, datos: estadoVacio() }, 'formato'],
    ['versión del futuro', { ...valido, version: VERSION + 1 }, 'version'],
    ['sin datos', { formato: FORMATO, version: VERSION }, 'datos'],
    ['historial que no es lista', { ...valido, datos: { ...estadoVacio(), historial: {} } }, 'datos'],
    ['historial sin modo', { ...valido, datos: { ...estadoVacio(), historial: [{ puntos: 1 }] } }, 'datos'],
    ['ultimoExport que no es número', { ...valido, datos: { ...estadoVacio(), ultimoExport: 'ayer' } }, 'datos'],
    ['null', null, 'formato'],
  ];
  for (const [nombre, entrada, error] of casos) {
    const r = g.importar(entrada);
    verdad(!r.ok && r.error === error, `${nombre}: esperaba error ${error}, salió ${JSON.stringify(r)}`);
  }
  igual(g.partida('palabra'), { x: 1 }, 'lo guardado debía quedar intacto');
});

prueba('importar descarta claves que envenenan el prototipo', async () => {
  const sucio = '{"formato":"boredom-killer","version":1,"datos":{"ajustes":{"__proto__":{"roto":true},"idioma":"es"},"partidas":{"constructor":{"x":1}},"historial":[],"ultimoExport":null}}';
  const r = leerExport(sucio);
  verdad(r.ok);
  igual({}.roto, undefined, 'el prototipo de todos los objetos no debe cambiar');
  igual(Object.keys(r.estado.ajustes), ['idioma']);
  igual(Object.keys(r.estado.partidas), []);
});

prueba('aviso de exportar: sin datos no molesta, con datos nunca exportados avisa', () => {
  const vacio = estadoVacio();
  igual(avisoExportar(vacio, 100 * DIA), null);
  igual(avisoExportar({ ...vacio, ajustes: { idioma: 'en' } }, 100 * DIA), null, 'los ajustes solos no cuentan como datos');
  igual(avisoExportar({ ...vacio, historial: [{ modo: 'p' }] }, 100 * DIA), { nunca: true });
  igual(avisoExportar({ ...vacio, partidas: { p: {} } }, 100 * DIA), { nunca: true });
});

prueba('aviso de exportar: avisa recién a los días del umbral', () => {
  const e = (hace) => ({ ...estadoVacio(), historial: [{ modo: 'p' }], ultimoExport: 100 * DIA - hace });
  igual(avisoExportar(e(3 * DIA), 100 * DIA), null);
  igual(avisoExportar(e((DIAS_AVISO - 1) * DIA), 100 * DIA), null);
  igual(avisoExportar(e(DIAS_AVISO * DIA), 100 * DIA), { dias: DIAS_AVISO });
  igual(avisoExportar(e(20 * DIA), 100 * DIA), { dias: 20 });
});

prueba('aviso de exportar: exportar lo apaga', async () => {
  let ahora = 10 * DIA;
  const g = await nuevo(almacenMemoria(), () => ahora);
  await g.anotar('palabra', {});
  igual(g.aviso(), { nunca: true });
  g.exportar();
  igual(g.aviso(), null);
  ahora += DIAS_AVISO * DIA;
  igual(g.aviso(), { dias: DIAS_AVISO });
});
