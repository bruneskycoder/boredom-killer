// Pantalla provisoria de un modo que todavía no se construyó. Se reemplaza modo por modo.
import { el } from '../nucleo/dom.js';

export function montarPendiente(contenedor, ctx) {
  contenedor.append(
    el('div', { class: 'panel pendiente' },
      el('h2', {}, ctx.t('nombre')),
      el('p', { class: 'nota' }, ctx.t('linea')),
      el('p', {}, ctx.t('pendiente'))),
  );
}
