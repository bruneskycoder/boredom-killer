// Fondo: campo de flujo en Canvas 2D. Partículas que siguen un campo de ángulos suave y dejan estela.
// Se dibuja a baja resolución (1 píxel propio = ESCALA px de pantalla) y el CSS lo estira.
// Se pausa con la pestaña oculta. Con "reducir movimiento" queda una imagen fija.

const ESCALA = 2;
const CLARO = '236,231,217';
const ESPERA = 200; // pasos que se calculan de golpe para la imagen fija

function aRGB(color) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(color).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `${n >> 16},${(n >> 8) & 255},${n & 255}`;
}

export function crearFondo(lienzo) {
  const ctx = lienzo.getContext('2d');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ancho = 0, alto = 0, ps = [], t = Math.random() * 100, cuadro = 0, raf = 0;
  let tension = 0.1, meta = 0.1, tono = '255,79,46', deuda = 0;

  function nueva(p = {}) {
    p.x = Math.random() * ancho;
    p.y = Math.random() * alto;
    p.vida = 60 + Math.random() * 260;
    p.azar = Math.random();
    return p;
  }

  function medir() {
    const w = Math.max(1, Math.round(lienzo.clientWidth / ESCALA));
    const h = Math.max(1, Math.round(lienzo.clientHeight / ESCALA));
    if (w === ancho && h === alto) return;
    ancho = lienzo.width = w;
    alto = lienzo.height = h;
    ps = [];
    if (quieto) fija();
  }

  // Tres ondas sumadas: da un campo que fluye sin tablas de ruido.
  function angulo(x, y, f) {
    return (Math.sin(x * f + t) + Math.sin(y * f * 1.37 - t * 0.8) + Math.sin((x * 0.6 + y * 0.8) * f * 1.9 + t * 0.6)) * 2.1;
  }

  function paso() {
    tension += (meta - tension) * 0.04;
    const k = tension;
    const cantidad = Math.round((150 + 460 * k) * Math.min(2.2, (ancho * alto) / 80000));
    while (ps.length < cantidad) ps.push(nueva());
    ps.length = cantidad;
    const vel = 0.18 + 1.5 * k, f = 0.007 + 0.009 * k, conTono = 0.06 + 0.5 * k;
    t += 0.0006 + 0.006 * k;

    // La estela se apaga de a saltos de al menos 6 %: con saltos más chicos el redondeo deja un velo que no se borra.
    // En calma se apaga despacio (estelas largas); en tensión, rápido.
    deuda += 0.012 + 0.09 * k * k;
    if (deuda >= 0.06) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${deuda})`;
      ctx.fillRect(0, 0, ancho, alto);
      ctx.globalCompositeOperation = 'source-over';
      deuda = 0;
    }
    ctx.lineWidth = 1;

    for (const acento of [false, true]) {
      ctx.strokeStyle = acento ? `rgba(${tono},${0.35 + 0.45 * k})` : `rgba(${CLARO},${0.1 + 0.16 * k})`;
      ctx.beginPath();
      for (const p of ps) {
        if ((p.azar < conTono) !== acento) continue;
        const a = angulo(p.x, p.y, f);
        const x = p.x + Math.cos(a) * vel, y = p.y + Math.sin(a) * vel;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(x, y);
        p.x = x; p.y = y;
        if (--p.vida < 0 || x < 0 || y < 0 || x > ancho || y > alto) nueva(p);
      }
      ctx.stroke();
    }
  }

  function fija() {
    tension = meta;
    ctx.clearRect(0, 0, ancho, alto);
    for (let i = 0; i < ESPERA; i++) paso();
  }

  function ciclo() {
    raf = requestAnimationFrame(ciclo);
    cuadro++;
    if (tension < 0.25 && cuadro % 2) return; // en calma alcanza con la mitad de los cuadros
    paso();
  }
  function arrancar() { if (!raf && !quieto && !document.hidden) raf = requestAnimationFrame(ciclo); }
  function frenar() { cancelAnimationFrame(raf); raf = 0; }
  function alCambiarVista() { document.hidden ? frenar() : arrancar(); }

  addEventListener('resize', medir);
  document.addEventListener('visibilitychange', alCambiarVista);
  medir();
  arrancar();

  return {
    // tension: 0 (calmo, casi quieto) a 1 (tenso). tono: color en #rrggbb.
    fijar({ tension: nuevaTension, tono: nuevoTono } = {}) {
      if (typeof nuevaTension === 'number') meta = Math.min(1, Math.max(0, nuevaTension));
      if (nuevoTono) tono = aRGB(nuevoTono) || tono;
      if (quieto) fija();
    },
    frenar,
    arrancar,
    destruir() {
      frenar();
      removeEventListener('resize', medir);
      document.removeEventListener('visibilitychange', alCambiarVista);
    },
  };
}
