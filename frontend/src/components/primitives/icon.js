import alertCircleRaw from 'lucide-static/icons/alert-circle.svg?raw';
import alertTriangleRaw from 'lucide-static/icons/alert-triangle.svg?raw';
import checkRaw from 'lucide-static/icons/check.svg?raw';
import eyeOffRaw from 'lucide-static/icons/eye-off.svg?raw';
import eyeRaw from 'lucide-static/icons/eye.svg?raw';
import lockRaw from 'lucide-static/icons/lock.svg?raw';
import logOutRaw from 'lucide-static/icons/log-out.svg?raw';
import mailRaw from 'lucide-static/icons/mail.svg?raw';
import moonRaw from 'lucide-static/icons/moon.svg?raw';
import sunRaw from 'lucide-static/icons/sun.svg?raw';
import arrowLeftRaw from 'lucide-static/icons/arrow-left.svg?raw';
import arrowRightRaw from 'lucide-static/icons/arrow-right.svg?raw';
import bellRaw from 'lucide-static/icons/bell.svg?raw';
import birdRaw from 'lucide-static/icons/bird.svg?raw';
import bookmarkRaw from 'lucide-static/icons/bookmark.svg?raw';
import calendarRaw from 'lucide-static/icons/calendar.svg?raw';
import catRaw from 'lucide-static/icons/cat.svg?raw';
import chevronDownRaw from 'lucide-static/icons/chevron-down.svg?raw';
import circleCheckRaw from 'lucide-static/icons/circle-check.svg?raw';
import compassRaw from 'lucide-static/icons/compass.svg?raw';
import dogRaw from 'lucide-static/icons/dog.svg?raw';
import fishRaw from 'lucide-static/icons/fish.svg?raw';
import globeRaw from 'lucide-static/icons/globe.svg?raw';
import heartRaw from 'lucide-static/icons/heart.svg?raw';
import homeRaw from 'lucide-static/icons/home.svg?raw';
import imageRaw from 'lucide-static/icons/image.svg?raw';
import messageCircleRaw from 'lucide-static/icons/message-circle.svg?raw';
import messageSquareRaw from 'lucide-static/icons/message-square.svg?raw';
import moreHorizontalRaw from 'lucide-static/icons/more-horizontal.svg?raw';
import pawPrintRaw from 'lucide-static/icons/paw-print.svg?raw';
import plusRaw from 'lucide-static/icons/plus.svg?raw';
import rabbitRaw from 'lucide-static/icons/rabbit.svg?raw';
import searchRaw from 'lucide-static/icons/search.svg?raw';
import sendRaw from 'lucide-static/icons/send.svg?raw';
import share2Raw from 'lucide-static/icons/share-2.svg?raw';
import turtleRaw from 'lucide-static/icons/turtle.svg?raw';
import uploadRaw from 'lucide-static/icons/upload.svg?raw';
import userRaw from 'lucide-static/icons/user.svg?raw';
import xRaw from 'lucide-static/icons/x.svg?raw';
import usersRaw from 'lucide-static/icons/users.svg?raw';
import shieldRaw from 'lucide-static/icons/shield.svg?raw';
import zapRaw from 'lucide-static/icons/zap.svg?raw';
import archiveRaw from 'lucide-static/icons/archive.svg?raw';
import cameraRaw from 'lucide-static/icons/camera.svg?raw';
import chevronLeftRaw from 'lucide-static/icons/chevron-left.svg?raw';
import chevronRightRaw from 'lucide-static/icons/chevron-right.svg?raw';
import clockRaw from 'lucide-static/icons/clock.svg?raw';
import hashRaw from 'lucide-static/icons/hash.svg?raw';
import moreVerticalRaw from 'lucide-static/icons/more-vertical.svg?raw';
import pauseRaw from 'lucide-static/icons/pause.svg?raw';
import pencilRaw from 'lucide-static/icons/pencil.svg?raw';
import playRaw from 'lucide-static/icons/play.svg?raw';
import settingsRaw from 'lucide-static/icons/settings.svg?raw';
import slidersHorizontalRaw from 'lucide-static/icons/sliders-horizontal.svg?raw';
import trash2Raw from 'lucide-static/icons/trash-2.svg?raw';
import trendingUpRaw from 'lucide-static/icons/trending-up.svg?raw';
import userPlusRaw from 'lucide-static/icons/user-plus.svg?raw';

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
  'log-out': logOutRaw,
  mail: mailRaw,
  'arrow-left': arrowLeftRaw,
  'arrow-right': arrowRightRaw,
  bell: bellRaw,
  bird: birdRaw,
  bookmark: bookmarkRaw,
  calendar: calendarRaw,
  cat: catRaw,
  'chevron-down': chevronDownRaw,
  'circle-check': circleCheckRaw,
  compass: compassRaw,
  dog: dogRaw,
  fish: fishRaw,
  globe: globeRaw,
  heart: heartRaw,
  home: homeRaw,
  image: imageRaw,
  'message-circle': messageCircleRaw,
  'message-square': messageSquareRaw,
  'more-horizontal': moreHorizontalRaw,
  'paw-print': pawPrintRaw,
  plus: plusRaw,
  rabbit: rabbitRaw,
  search: searchRaw,
  send: sendRaw,
  'share-2': share2Raw,
  turtle: turtleRaw,
  upload: uploadRaw,
  user: userRaw,
  moon: moonRaw,
  sun: sunRaw,
  x: xRaw,
  users: usersRaw,
  shield: shieldRaw,
  zap: zapRaw,
  archive: archiveRaw,
  camera: cameraRaw,
  'chevron-left': chevronLeftRaw,
  'chevron-right': chevronRightRaw,
  clock: clockRaw,
  hash: hashRaw,
  'more-vertical': moreVerticalRaw,
  pause: pauseRaw,
  pencil: pencilRaw,
  play: playRaw,
  settings: settingsRaw,
  'sliders-horizontal': slidersHorizontalRaw,
  'trash-2': trash2Raw,
  'trending-up': trendingUpRaw,
  'user-plus': userPlusRaw,
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
