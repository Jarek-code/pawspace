import logoUrl from '@/assets/brand/pawspace-logo-light.svg';
import { createIcon } from '@/components/primitives/icon.js';
import { h } from '@/lib/dom.js';
import { pickIllustration } from '@/lib/illustration.js';

const DEFAULT_BENEFITS = [
  'Perfil propio para cada mascota',
  'Historias, publicaciones y mensajes',
  'Privacidad bajo tu control',
];

/**
 * CMP-45 — BrandPanel.
 * Mascota + mensaje emocional + tres beneficios + pie legal. La ilustración
 * nunca se deforma: object-fit contain.
 */
export function createBrandPanel({
  headline = 'Un espacio hecho para tu mascota.',
  benefits = DEFAULT_BENEFITS,
  illustrationAlt = 'Mascota astronauta de PawSpace',
  legal = '© 2026 PawSpace · Términos de uso · Aviso de privacidad',
} = {}) {
  const illustration = pickIllustration();

  const benefitItems = benefits.map((benefit) =>
    h(
      'li',
      { class: 'ps-brand-panel__benefit' },
      h(
        'span',
        { class: 'ps-brand-panel__benefit-icon', 'aria-hidden': 'true' },
        createIcon('check', { size: 16 }),
      ),
      h('span', { text: benefit }),
    ),
  );

  return h(
    'section',
    { class: 'ps-brand-panel', attrs: { 'aria-label': 'Presentación de PawSpace' } },
    h(
      'div',
      { class: 'ps-brand-panel__header' },
      h('img', {
        class: 'ps-brand-panel__logo',
        src: logoUrl,
        alt: '',
        width: 36,
        height: 48,
      }),
      h('p', { class: 'ps-brand-panel__name', text: 'PawSpace' }),
    ),
    h(
      'div',
      { class: 'ps-brand-panel__hero' },
      h(
        'div',
        { class: 'ps-brand-panel__illustration' },
        h('img', { src: illustration.url, alt: illustrationAlt }),
      ),
      h(
        'div',
        { class: 'ps-brand-panel__copy' },
        h('p', { class: 'ps-brand-panel__headline', text: headline }),
        h('ul', { class: 'ps-brand-panel__benefits' }, benefitItems),
      ),
    ),
    h('p', { class: 'ps-brand-panel__legal', text: legal }),
  );
}
