// "Elegí por mí": propone el modo que hace más tiempo que no se juega (uno nunca jugado gana a todos).
// Si hay empate se sortea. azar() devuelve un número en [0, 1); se puede inyectar para probar.
export function elegirPorMi(ids, historial, azar = Math.random) {
  if (!ids.length) return null;
  const ultimo = Object.fromEntries(ids.map((id) => [id, -Infinity]));
  for (const h of historial) if (h.modo in ultimo && h.cuando > ultimo[h.modo]) ultimo[h.modo] = h.cuando;
  const mas = Math.min(...Object.values(ultimo));
  const candidatos = ids.filter((id) => ultimo[id] === mas);
  return candidatos[Math.floor(azar() * candidatos.length)];
}
