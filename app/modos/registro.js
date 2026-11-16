// Lista de modos: una línea por modo. Sin servidor la página no puede descubrir carpetas sola.
import palabra from './palabra/index.js';
import dondeQueda from './donde-queda/index.js';
import ingles from './ingles/index.js';
import silueta from './silueta/index.js';

export const FAMILIAS = ['pensar', 'jugar', 'crear', 'mirar', 'aprender'];
export const TONO_FAMILIA = { pensar: '#4fd8ff', jugar: '#ff4f2e', crear: '#ff8ad1', mirar: '#ffc145', aprender: '#3ddc84' };

export const MODOS = [palabra, dondeQueda, silueta, ingles];
