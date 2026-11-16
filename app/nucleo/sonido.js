// Sonidos base: guitarra criolla sintetizada, sin archivos de audio ni código de terceros.
// - Cuerda pulsada: método de Karplus-Strong. Un ruido corto (la pulsación) da vueltas por un retardo
//   del largo de la nota y en cada vuelta se suaviza, como una cuerda de nylon que se va apagando.
// - Golpe en la caja: dos resonancias graves que se apagan rápido, más un chasquido.
// Los cuatro sonidos: punteo que sube (acierto), dos notas que bajan con golpe (error), una nota sola (turno) y chan-chan (fin).

const NOTA = {
  E2: 82.41, B2: 123.47, 'D#3': 155.56, E3: 164.81, G3: 196, 'G#3': 207.65, A3: 220, B3: 246.94,
  E4: 329.63, 'F#4': 369.99, 'G#4': 415.3, B4: 493.88,
};
const SI7 = ['B2', 'D#3', 'A3', 'B3', 'F#4'];
const MI = ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'];

// t: cuándo arranca (s) · dura: cuánto tarda en apagarse (s) · vol: 0 a 1
const cuerda = (nota, t, dura, vol) => ({ tipo: 'cuerda', hz: NOTA[nota], t, dura, vol });
const rasgueo = (notas, t, dura, vol) => notas.map((n, i) => cuerda(n, t + i * 0.022, dura, vol));

const SONIDOS = {
  acierto: [cuerda('E4', 0, 2.2, 0.5), cuerda('G#4', 0.09, 2.2, 0.5), cuerda('B4', 0.18, 2.6, 0.55)],
  error: [{ tipo: 'golpe', t: 0, vol: 0.22 }, cuerda('B3', 0.01, 1.4, 0.5), cuerda('G3', 0.17, 1.8, 0.5)],
  turno: [cuerda('E4', 0, 0.6, 0.4)],
  fin: [...rasgueo(SI7, 0, 0.9, 0.2), ...rasgueo(MI, 0.42, 3.5, 0.2)],
};

export const nombres = Object.keys(SONIDOS);

function normalizar(y, sr) {
  let pico = 0;
  for (let i = 0; i < y.length; i++) pico = Math.max(pico, Math.abs(y[i]));
  const cola = Math.min(y.length, Math.round(sr * 0.02));
  for (let i = 0; i < y.length; i++) y[i] *= (1 / (pico || 1)) * Math.min(1, (y.length - i) / cola);
  return y;
}

// Devuelve las muestras de una cuerda pulsada. Función pura (se puede probar sin audio).
// brillo: cuánto agudo trae la pulsación (0 opaco a 1 claro).
// suavidad: cuánto se comen los agudos en cada vuelta (0,5 se apaga opaco; cerca de 0 queda metálico).
export function sintetizarCuerda(sr, hz, dura, brillo = 0.9, suavidad = 0.12) {
  const periodo = sr / hz;
  // El retardo casi nunca es un número entero de muestras: la parte que sobra (resto) la pone un filtro
  // que atrasa sin comerse agudos, así la nota queda afinada y clara.
  const entero = Math.floor(periodo - suavidad - 0.1), resto = periodo - suavidad - entero;
  const c = (1 - resto) / (1 + resto);
  const largo = entero + 2;
  const y = new Float32Array(Math.ceil(sr * (dura + 0.05)) + largo);

  // Pulsación: ruido suavizado (la yema del dedo) y "peinado" por el punto donde se pulsa (a un quinto de la cuerda)
  const ruido = new Float32Array(largo);
  let s = 0;
  for (let i = 0; i < largo; i++) { s += brillo * (Math.random() * 2 - 1 - s); ruido[i] = s; }
  const quinto = Math.max(1, Math.round(periodo / 5));
  for (let i = 0; i < largo; i++) y[i] = ruido[i] - ruido[(i - quinto + largo) % largo];

  // Cada vuelta: mezcla de dos muestras vecinas (apaga primero los agudos) por una pérdida que fija la duración
  const perdida = Math.pow(0.001, 1 / (hz * dura));
  let entro = 0, salio = 0;
  for (let i = largo; i < y.length; i++) {
    const mezcla = (1 - suavidad) * y[i - entero] + suavidad * y[i - entero - 1];
    salio = c * mezcla + entro - c * salio;
    entro = mezcla;
    y[i] = perdida * salio;
  }
  return normalizar(y, sr);
}

export function sintetizarGolpe(sr, dura = 0.16) {
  const y = new Float32Array(Math.ceil(sr * dura));
  const dosPi = 2 * Math.PI;
  for (let i = 0; i < y.length; i++) {
    const t = i / sr;
    y[i] = Math.sin(dosPi * 190 * t) * Math.exp(-t / 0.035)
      + 0.6 * Math.sin(dosPi * 410 * t) * Math.exp(-t / 0.02)
      + 0.5 * (Math.random() * 2 - 1) * Math.exp(-t / 0.004);
  }
  return normalizar(y, sr);
}

let ctx = null, salida = null, encendido = true;
const guardados = new Map();

function contexto() {
  if (ctx) return ctx;
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) return null;
  ctx = new Audio();
  // La caja de la guitarra: un poco de cuerpo en los graves, sin recortar el brillo
  const caja = ctx.createBiquadFilter();
  caja.type = 'peaking'; caja.frequency.value = 200; caja.Q.value = 1; caja.gain.value = 3;
  const techo = ctx.createBiquadFilter();
  techo.type = 'lowpass'; techo.frequency.value = 9000;
  salida = ctx.createGain();
  salida.gain.value = 0.75;
  salida.connect(caja); caja.connect(techo); techo.connect(ctx.destination);
  // Sala: una cola de ruido que se apaga en 1,2 s, mezclada bajito, para que no suene seco
  const sr = ctx.sampleRate, eco = ctx.createBuffer(2, Math.round(sr * 1.2), sr);
  for (let canal = 0; canal < 2; canal++) {
    const d = eco.getChannelData(canal);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.22));
  }
  const sala = ctx.createConvolver(), mezcla = ctx.createGain();
  sala.buffer = eco;
  mezcla.gain.value = 0.16;
  techo.connect(sala); sala.connect(mezcla); mezcla.connect(ctx.destination);
  return ctx;
}

function muestras(evento) {
  const clave = evento.tipo === 'golpe' ? 'golpe' : `${evento.hz}/${evento.dura}`;
  if (!guardados.has(clave)) {
    const datos = evento.tipo === 'golpe' ? sintetizarGolpe(ctx.sampleRate) : sintetizarCuerda(ctx.sampleRate, evento.hz, evento.dura);
    const bufer = ctx.createBuffer(1, datos.length, ctx.sampleRate);
    bufer.getChannelData(0).set(datos);
    guardados.set(clave, bufer);
  }
  return guardados.get(clave);
}

export function encender(si) { encendido = !!si; }

// En iPhone el audio solo arranca después de un toque: llamar desde el primer toque del usuario.
export function activar() {
  const c = contexto();
  if (c && c.state !== 'running') c.resume();
}

export function tocar(nombre) {
  if (!encendido || !SONIDOS[nombre] || !contexto()) return;
  activar();
  const partes = SONIDOS[nombre].map((evento) => [evento, muestras(evento)]);
  const ahora = ctx.currentTime + 0.01;
  for (const [evento, bufer] of partes) {
    const fuente = ctx.createBufferSource(), volumen = ctx.createGain();
    fuente.buffer = bufer;
    volumen.gain.value = evento.vol;
    fuente.connect(volumen); volumen.connect(salida);
    fuente.start(ahora + evento.t);
  }
}
