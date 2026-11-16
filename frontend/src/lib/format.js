/**
 * Formateadores compartidos por perfil, historias y exploración.
 * Español de México, sin dependencias externas.
 */

const NUMBER = new Intl.NumberFormat('es-MX');

export function formatCount(value) {
  const number = Number(value || 0);

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(number % 1_000_000 === 0 ? 0 : 1)} M`;
  }

  if (number >= 1_000) {
    return `${(number / 1_000).toFixed(number % 1_000 === 0 ? 0 : 1)} mil`;
  }

  return NUMBER.format(number);
}

export function formatAge(fechaNacimiento) {
  if (!fechaNacimiento) {
    return 'Edad no indicada';
  }

  const birth = new Date(`${fechaNacimiento}T00:00:00`);
  const now = new Date();

  if (Number.isNaN(birth.getTime()) || birth > now) {
    return 'Edad no indicada';
  }

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();

  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (years <= 0) {
    return rest <= 0 ? 'Menos de un mes' : `${rest} ${rest === 1 ? 'mes' : 'meses'}`;
  }

  return `${years} ${years === 1 ? 'año' : 'años'}`;
}

export function speciesIcon(especie) {
  const key = String(especie || '').toLowerCase();
  const map = {
    perro: 'dog',
    gato: 'cat',
    ave: 'bird',
    conejo: 'rabbit',
    pez: 'fish',
    tortuga: 'turtle',
  };

  return map[key] || 'paw-print';
}

export function handleOf(value) {
  const clean = String(value || '').trim();
  return clean.startsWith('@') ? clean : `@${clean}`;
}
