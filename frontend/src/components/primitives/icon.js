import alertCircleRaw from 'lucide-static/icons/alert-circle.svg?raw';
import alertTriangleRaw from 'lucide-static/icons/alert-triangle.svg?raw';
import checkRaw from 'lucide-static/icons/check.svg?raw';
import eyeOffRaw from 'lucide-static/icons/eye-off.svg?raw';
import eyeRaw from 'lucide-static/icons/eye.svg?raw';
import lockRaw from 'lucide-static/icons/lock.svg?raw';
import mailRaw from 'lucide-static/icons/mail.svg?raw';
import moonRaw from 'lucide-static/icons/moon.svg?raw';
import sunRaw from 'lucide-static/icons/sun.svg?raw';
import arrowLeftRaw from 'lucide-static/icons/arrow-left.svg?raw';
import arrowRightRaw from 'lucide-static/icons/arrow-right.svg?raw';
import birdRaw from 'lucide-static/icons/bird.svg?raw';
import calendarRaw from 'lucide-static/icons/calendar.svg?raw';
import catRaw from 'lucide-static/icons/cat.svg?raw';
import chevronDownRaw from 'lucide-static/icons/chevron-down.svg?raw';
import circleCheckRaw from 'lucide-static/icons/circle-check.svg?raw';
import dogRaw from 'lucide-static/icons/dog.svg?raw';
import fishRaw from 'lucide-static/icons/fish.svg?raw';
import globeRaw from 'lucide-static/icons/globe.svg?raw';
import imageRaw from 'lucide-static/icons/image.svg?raw';
import pawPrintRaw from 'lucide-static/icons/paw-print.svg?raw';
import plusRaw from 'lucide-static/icons/plus.svg?raw';
import rabbitRaw from 'lucide-static/icons/rabbit.svg?raw';
import searchRaw from 'lucide-static/icons/search.svg?raw';
import turtleRaw from 'lucide-static/icons/turtle.svg?raw';
import uploadRaw from 'lucide-static/icons/upload.svg?raw';
import userRaw from 'lucide-static/icons/user.svg?raw';
import xRaw from 'lucide-static/icons/x.svg?raw';
import usersRaw from 'lucide-static/icons/users.svg?raw';
import shieldRaw from 'lucide-static/icons/shield.svg?raw';

/**
 * Registro explícito de iconos Lucide. Solo se empaqueta lo que se usa.
 * El HTML de estos SVG es estático y viene del paquete, no de datos de usuario.
 */
const ICONS = {
  alert: alertCircleRaw,
  warning: alertTriangleRaw,
  check: checkRaw,
  eye: eyeRaw,
  'eye-off': eyeOffRaw,
  lock: lockRaw,
  mail: mailRaw,
  'arrow-left': arrowLeftRaw,
  'arrow-right': arrowRightRaw,
  bird: birdRaw,
  calendar: calendarRaw,
  cat: catRaw,
  'chevron-down': chevronDownRaw,
  'circle-check': circleCheckRaw,
  dog: dogRaw,
  fish: fishRaw,
  globe: globeRaw,
  image: imageRaw,
  'paw-print': pawPrintRaw,
  plus: plusRaw,
  rabbit: rabbitRaw,
  search: searchRaw,
  turtle: turtleRaw,
  upload: uploadRaw,
  user: userRaw,
  moon: moonRaw,
  sun: sunRaw,
  x: xRaw,
  users: usersRaw,
  shield: shieldRaw,
};

export function createIcon(name, { size = 20, label = '', className = '' } = {}) {
  const markup = ICONS[name];

  if (!markup) {
    throw new Error(`Icono no registrado: ${name}`);
  }

  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  const svg = template.content.firstElementChild;

  if (!svg) {
    throw new Error(`No se pudo construir el icono: ${name}`);
  }

  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.classList.add('ps-icon');

  if (className) {
    svg.classList.add(className);
  }

  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
    svg.removeAttribute('aria-hidden');
  } else {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  }

  return svg;
}
