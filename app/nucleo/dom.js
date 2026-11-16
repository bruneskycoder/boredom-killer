// Armar elementos sin innerHTML (los textos entran siempre como texto, nunca como HTML).
// el('button', { class: 'boton', onclick: fn, 'aria-pressed': 'true' }, 'Texto', otroNodo)
// Ojo: un atributo con valor false o null se omite; para aria-pressed pasar los textos 'true' / 'false'.
export function el(etiqueta, props = {}, ...hijos) {
  const n = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  n.append(...hijos.flat().filter((h) => h != null && h !== false));
  return n;
}
