import { createTabs } from '@/components/primitives/tabs.js';

/**
 * CMP-54 — FeedTabs.
 * Pestañas "Para ti" y "Siguiendo". Reutiliza CMP-31; la activa usa negrita y
 * subrayado.
 */
export function createFeedTabs({ active = 'para-ti', onChange = null } = {}) {
  return createTabs({
    tabs: [
      { label: 'Para ti', value: 'para-ti', active: active === 'para-ti' },
      { label: 'Siguiendo', value: 'siguiendo', active: active === 'siguiendo' },
    ],
    onChange,
  });
}
