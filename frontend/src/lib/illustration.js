import gatitoProyectado from '@/assets/brand/gatito-proyectado.svg';
import gatoMarciano from '@/assets/brand/gato-marciano.svg';
import israelitaPromedio from '@/assets/brand/israelita-promedio.svg';
import perritoAstronauta from '@/assets/brand/perrito-astronauta.svg';
import logoGataDura from '@/assets/brand/logo-gata-dura.svg';
import logoGataHayComoSufro from '@/assets/brand/logo-gata-hay-como-sufro.svg';

/**
 * Ilustración del panel de marca.
 *
 * Rotación aleatoria sin repetir la misma dos pantallas seguidas, con un carril
 * de imágenes especiales que aparecen con probabilidad 1/1000. Ese carril está
 * vacío por ahora: al agregar una URL se activa el mecanismo sin tocar nada más.
 */

export const REGULAR_ILLUSTRATIONS = [
  gatitoProyectado,
  gatoMarciano,
  israelitaPromedio,
  perritoAstronauta,
  logoGataDura,
  logoGataHayComoSufro,
];

export const RARE_ILLUSTRATIONS = [];

const RARE_RATE = 1 / 1000;

let lastIndex = -1;

function pickIndex(list, random, forbiddenIndex = -1) {
  if (list.length === 0) {
    return -1;
  }

  if (list.length === 1) {
    return 0;
  }

  const allowed = [];

  for (let index = 0; index < list.length; index += 1) {
    if (index !== forbiddenIndex) {
      allowed.push(index);
    }
  }

  return allowed[Math.floor(random() * allowed.length)];
}

/**
 * Elige la siguiente ilustración. Devuelve `{ url, rare }`.
 *
 * `random` y `rareList` son inyectables para poder probar el 1/1000 y la
 * rotación sin depender del azar.
 */
export function pickIllustration({ random = Math.random, rareList = RARE_ILLUSTRATIONS } = {}) {
  if (rareList.length > 0 && random() < RARE_RATE) {
    const rareIndex = pickIndex(rareList, random);
    lastIndex = -1;
    return { url: rareList[rareIndex], rare: true };
  }

  const index = pickIndex(REGULAR_ILLUSTRATIONS, random, lastIndex);
  lastIndex = index;
  return { url: REGULAR_ILLUSTRATIONS[index], rare: false };
}

export function resetIllustration() {
  lastIndex = -1;
}
