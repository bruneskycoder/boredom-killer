import { prueba, igual } from './corredor.js';
import { elegirPorMi } from '../app/nucleo/elegir.js';

const ids = ['palabra', 'donde-queda', 'ingles'];

prueba('elegí por mí: un modo nunca jugado gana a los jugados', () => {
  const h = [{ modo: 'palabra', cuando: 5 }, { modo: 'ingles', cuando: 9 }];
  igual(elegirPorMi(ids, h), 'donde-queda');
});

prueba('elegí por mí: entre todos jugados, el que hace más tiempo', () => {
  const h = [{ modo: 'palabra', cuando: 50 }, { modo: 'donde-queda', cuando: 10 }, { modo: 'ingles', cuando: 30 }, { modo: 'donde-queda', cuando: 5 }];
  igual(elegirPorMi(ids, h), 'donde-queda', 'cuenta su último juego (10), el más viejo');
  igual(elegirPorMi(ids, [...h, { modo: 'donde-queda', cuando: 99 }]), 'ingles');
});

prueba('elegí por mí: empate se sortea entre los empatados y solo entre ellos', () => {
  igual(elegirPorMi(ids, [], () => 0), 'palabra');
  igual(elegirPorMi(ids, [], () => 0.99), 'ingles');
  const h = [{ modo: 'palabra', cuando: 1 }];
  igual(elegirPorMi(ids, h, () => 0), 'donde-queda');
  igual(elegirPorMi(ids, h, () => 0.99), 'ingles');
});

prueba('elegí por mí: ignora modos desconocidos y la lista vacía', () => {
  igual(elegirPorMi(ids, [{ modo: 'fantasma', cuando: 1 }], () => 0), 'palabra');
  igual(elegirPorMi([], []), null);
});
