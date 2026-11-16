// Idiomas: cada texto se pide por clave. Los diccionarios viven en archivos de textos (textos-app.js y uno por modo).

export const IDIOMAS = [
  { id: 'es', etiqueta: 'Español', html: 'es-AR' },
  { id: 'en', etiqueta: 'English', html: 'en' },
];

export function interpolar(texto, vars = {}) {
  return texto.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

// Idioma de arranque: el elegido; si no hay, el del navegador; si no, español.
export function idiomaInicial(elegido, lenguaje = '') {
  if (IDIOMAS.some((i) => i.id === elegido)) return elegido;
  return String(lenguaje).toLowerCase().startsWith('en') ? 'en' : 'es';
}

// Une los textos de la app con los de cada modo (las claves de un modo llevan el prefijo modo.<id>.).
export function unirTextos(app, modos) {
  const dic = {};
  for (const { id } of IDIOMAS) {
    dic[id] = { ...app[id] };
    for (const modo of modos) {
      for (const [k, v] of Object.entries(modo.textos[id] || {})) dic[id][`modo.${modo.id}.${k}`] = v;
    }
  }
  return dic;
}

// Si falta la clave en el idioma, cae al español; si tampoco está, devuelve la clave (se nota enseguida).
export function traducir(dic, idioma, clave, vars) {
  const texto = dic[idioma]?.[clave] ?? dic.es?.[clave];
  return texto === undefined ? clave : interpolar(texto, vars);
}
