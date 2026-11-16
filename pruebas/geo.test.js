import { prueba, igual, verdad } from './corredor.js';
import { distanciaKm, puntaje, cajaDe, proyeccion, proyectar, desproyectar, aPantalla, dePantalla, encuadre, zoomEn, mover, elegir } from '../app/modos/donde-queda/geo.js';

const cerca = (a, b, tol, nota = '') => verdad(Math.abs(a - b) <= tol, `${nota} ${a} no está a ${tol} de ${b}`.trim());

prueba('distancia: mismo punto es 0 y se conoce lo conocido', () => {
  igual(distanciaKm(10, 20, 10, 20), 0);
  cerca(distanciaKm(-58.4, -34.6, -3.7, 40.4), 10060, 100, 'Buenos Aires–Madrid');
  cerca(distanciaKm(-58.4, -34.6, -68.3, -54.8), 2400, 60, 'Buenos Aires–Ushuaia');
  cerca(distanciaKm(0, 0, 180, 0), 20015, 5, 'mitad de la Tierra');
  cerca(distanciaKm(0, 0, 1, 0), 111.2, 0.3, 'un grado en el ecuador');
});

prueba('distancia: simétrica y positiva', () => {
  cerca(distanciaKm(174.8, -36.8, -58.4, -34.6), distanciaKm(-58.4, -34.6, 174.8, -36.8), 1e-9);
});

prueba('puntaje: 1000 en el acierto, baja con los km, nunca negativo', () => {
  igual(puntaje(0, 500), 1000);
  igual(puntaje(500, 500), 368);
  verdad(puntaje(100, 500) > puntaje(200, 500) && puntaje(200, 500) > puntaje(1000, 500), 'tiene que bajar');
  igual(puntaje(1e6, 500), 0);
  igual(puntaje(-5, 500), 1000, 'un error negativo cuenta como 0');
});

prueba('puntaje: la escala de la lámina cambia cuánto pesa el error', () => {
  verdad(puntaje(300, 2000) > puntaje(300, 250), 'en el mundo 300 km es poco; en Nueva Zelanda es mucho');
});

prueba('caja: contiene todos los anillos', () => {
  igual(cajaDe([[1, 2, 5, 9], [-3, 4, 0, 0]]), { lonMin: -3, latMin: 0, lonMax: 5, latMax: 9 });
});

prueba('proyección: ida y vuelta exacta', () => {
  const P = proyeccion({ lonMin: -73, lonMax: -53, latMin: -55, latMax: -21 });
  for (const [lon, lat] of [[-58.4, -34.6], [-68.3, -54.8], [-73, -21]]) {
    const [u, v] = proyectar(lon, lat, P);
    const [lon2, lat2] = desproyectar(u, v, P);
    cerca(lon2, lon, 1e-9); cerca(lat2, lat, 1e-9);
  }
});

prueba('proyección: a 38° de latitud un grado de longitud mide menos que uno de latitud', () => {
  const P = proyeccion({ lonMin: -73, lonMax: -53, latMin: -55, latMax: -21 });
  cerca(P.c, Math.cos(38 * Math.PI / 180), 1e-9);
});

prueba('vista: pantalla y mapa son inversas', () => {
  const P = proyeccion({ lonMin: 166, lonMax: 179, latMin: -48, latMax: -34 });
  const V = encuadre({ lonMin: 166, lonMax: 179, latMin: -48, latMax: -34 }, P, 400, 300);
  const [u, v] = proyectar(174.8, -36.8, P);
  const [px, py] = aPantalla(u, v, V);
  const [u2, v2] = dePantalla(px, py, V);
  cerca(u2, u, 1e-9); cerca(v2, v, 1e-9);
});

prueba('encuadre: la caja entra completa en el lienzo', () => {
  const caja = { lonMin: -73, lonMax: -53, latMin: -55, latMax: -21 };
  const P = proyeccion(caja);
  const V = encuadre(caja, P, 400, 300);
  for (const [lon, lat] of [[caja.lonMin, caja.latMin], [caja.lonMax, caja.latMax], [caja.lonMin, caja.latMax], [caja.lonMax, caja.latMin]]) {
    const [x, y] = aPantalla(...proyectar(lon, lat, P), V);
    verdad(x >= 0 && x <= 400 && y >= 0 && y <= 300, `esquina fuera: ${x}, ${y}`);
  }
});

prueba('zoom: el punto bajo el dedo no se mueve', () => {
  const caja = { lonMin: -180, lonMax: 180, latMin: -58, latMax: 80 };
  const P = proyeccion(caja);
  let V = encuadre(caja, P, 600, 400);
  const px = 450, py = 120;
  const antes = dePantalla(px, py, V);
  V = zoomEn(V, px, py, 3);
  const despues = dePantalla(px, py, V);
  cerca(despues[0], antes[0], 1e-6); cerca(despues[1], antes[1], 1e-6);
  verdad(V.s > encuadre(caja, P, 600, 400).s * 2.9, 'tiene que haber acercado');
});

prueba('zoom: no pasa de los límites', () => {
  const caja = { lonMin: 0, lonMax: 10, latMin: 0, latMax: 10 };
  const V0 = encuadre(caja, proyeccion(caja), 300, 300);
  igual(zoomEn(V0, 150, 150, 0.1).s, V0.sMin);
  igual(zoomEn(V0, 150, 150, 1e6).s, V0.sMax);
});

prueba('mover: arrastrar no pierde el mapa de vista', () => {
  const caja = { lonMin: 0, lonMax: 10, latMin: 0, latMax: 10 };
  let V = encuadre(caja, proyeccion(caja), 300, 300);
  V = mover(V, 1e6, 1e6);
  const [u0, v0, u1, v1] = V.limites;
  verdad(V.cu >= u0 && V.cu <= u1 && V.cv >= v0 && V.cv <= v1, 'el centro salió de la caja');
});

prueba('elegir: n distintos, sin pasarse del total', () => {
  const lista = Array.from({ length: 30 }, (_, i) => i);
  const r = elegir(lista, 10);
  igual(r.length, 10);
  igual(new Set(r).size, 10);
  igual(elegir([1, 2, 3], 10).length, 3);
  igual(lista.length, 30, 'no toca la lista original');
  igual(elegir(lista, 5, () => 0).length, 5);
});
