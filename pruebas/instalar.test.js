import { prueba, igual } from './corredor.js';
import { tipoAviso } from '../app/nucleo/instalar.js';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36 Edg/130.0';

prueba('aviso de instalar: iPhone en Safari explica el gesto', () => {
  igual(tipoAviso({ ua: IPHONE }), 'ios');
});

prueba('aviso de instalar: iPad con aspecto de Mac también', () => {
  igual(tipoAviso({ ua: EDGE.replace('Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7'), plataforma: 'MacIntel', puntos: 5 }), 'ios');
  igual(tipoAviso({ plataforma: 'MacIntel', puntos: 0 }), null, 'una Mac de verdad no');
});

prueba('aviso de instalar: Edge ofrece botón solo cuando el navegador lo permite', () => {
  igual(tipoAviso({ ua: EDGE }), null);
  igual(tipoAviso({ ua: EDGE, hayPrompt: true }), 'prompt');
});

prueba('aviso de instalar: no aparece si ya está instalada o si se cerró', () => {
  igual(tipoAviso({ ua: IPHONE, standalone: true }), null);
  igual(tipoAviso({ ua: IPHONE, cerrado: true }), null);
  igual(tipoAviso({ ua: EDGE, hayPrompt: true, standalone: true }), null);
});
