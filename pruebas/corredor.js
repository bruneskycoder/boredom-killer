// Corredor mínimo de pruebas para el navegador (sin Node no hay otro).
const lista = [];

export const prueba = (nombre, fn) => lista.push({ nombre, fn });

export function igual(salio, esperado, nota = '') {
  const a = JSON.stringify(salio), b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${nota} esperado ${b}, salió ${a}`.trim());
}
export function verdad(condicion, nota = 'no se cumple') {
  if (!condicion) throw new Error(nota);
}

export async function correr() {
  const ul = document.getElementById('lista');
  let fallos = 0;
  for (const { nombre, fn } of lista) {
    const li = document.createElement('li');
    try { await fn(); li.textContent = `✓ ${nombre}`; li.className = 'ok'; }
    catch (e) { fallos++; li.textContent = `✗ ${nombre} — ${e.message}`; li.className = 'mal'; }
    ul.append(li);
  }
  const resumen = document.getElementById('resumen');
  resumen.textContent = fallos ? `${fallos} fallan de ${lista.length}` : `${lista.length} de ${lista.length} en verde`;
  resumen.className = fallos ? 'mal' : 'ok';
  document.body.dataset.fallos = fallos;
  document.body.dataset.total = lista.length;
}
