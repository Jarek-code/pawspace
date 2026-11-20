import { h } from '@/lib/dom.js';

/**
 * CMP-31 — Tabs.
 * Lista de pestañas con `role="tablist"`. La activa usa negrita y subrayado;
 * el cambio se comunica también con `aria-selected` (no solo color).
 */
export function createTabs({ tabs = [], onChange = null } = {}) {
  const buttons = tabs.map((tab) =>
    h('button', {
      class: 'ps-tabs__tab',
      type: 'button',
      role: 'tab',
      attrs: {
        'aria-selected': String(Boolean(tab.active)),
        'data-value': tab.value,
      },
      dataset: { value: tab.value },
      text: tab.label,
    }),
  );

  const element = h(
    'div',
    { class: 'ps-tabs', role: 'tablist', attrs: { 'aria-label': 'Pestañas' } },
    buttons,
  );

  function select(value) {
    for (const [index, tab] of tabs.entries()) {
      const active = tab.value === value;
      tabs[index].active = active;
      buttons[index].setAttribute('aria-selected', String(active));
      buttons[index].classList.toggle('is-active', active);
    }

    if (onChange) {
      onChange(value);
    }
  }

  for (const [index, tab] of tabs.entries()) {
    if (tab.active) {
      buttons[index].classList.add('is-active');
    }

    buttons[index].addEventListener('click', () => select(tab.value));
  }

  return { element, select };
}
