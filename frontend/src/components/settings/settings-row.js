import { createIcon } from '@/components/primitives/icon.js';
import { createSwitch } from '@/components/primitives/switch.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-85 — SettingsRow.
 * Variantes: switch, enlace con chevron, acción de texto y destructiva.
 * Toda la fila es clicable solo cuando no contiene un control interactivo.
 */
export function createSettingsRow({
  title = '',
  description = '',
  variant = 'action',
  control = null,
  checked = false,
  disabled = false,
  href = '',
  onClick = null,
  onChange = null,
} = {}) {
  if (variant === 'switch') {
    const field = createSwitch({
      label: title,
      description,
      checked,
      disabled,
      onChange,
    });

    return h('div', { class: 'ps-settings-row ps-settings-row--switch' }, field.element);
  }

  const text = h(
    'span',
    { class: 'ps-settings-row__text' },
    h('span', { class: 'ps-settings-row__title', text: title }),
    description ? h('span', { class: 'ps-settings-row__description', text: description }) : null,
  );

  const trailing =
    control ||
    (variant === 'link'
      ? h(
          'span',
          { class: 'ps-settings-row__chevron', 'aria-hidden': 'true' },
          createIcon('chevron-right', { size: 18 }),
        )
      : null);

  const className = [
    'ps-settings-row',
    variant === 'destructive' ? 'ps-settings-row--danger' : '',
    !control && (variant === 'link' || onClick) ? 'ps-settings-row--interactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    return h(
      'a',
      {
        class: className,
        href,
      },
      text,
      trailing,
    );
  }

  if (onClick && !control) {
    return h(
      'button',
      {
        class: className,
        type: 'button',
        onClick,
      },
      text,
      trailing,
    );
  }

  return h('div', { class: className }, text, trailing);
}
