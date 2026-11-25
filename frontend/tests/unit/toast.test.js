import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { showToast } from '@/components/primitives/toast.js';

function messages() {
  return Array.from(document.querySelectorAll('.ps-toast__message')).map(
    (node) => node.textContent,
  );
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('showToast', () => {
  it('muestra como máximo 5 avisos y descarta el más antiguo', () => {
    for (let index = 1; index <= 6; index += 1) {
      showToast(`Aviso ${index}`);
    }

    expect(messages()).toEqual(['Aviso 2', 'Aviso 3', 'Aviso 4', 'Aviso 5', 'Aviso 6']);
  });

  it('no duplica avisos idénticos, los mueve al final y reinicia su duración', () => {
    showToast('Avisos silenciados.');
    showToast('Otro aviso.');
    vi.advanceTimersByTime(3000);

    showToast('Avisos silenciados.');

    expect(messages().filter((text) => text === 'Avisos silenciados.')).toHaveLength(1);
    expect(messages()).toEqual(['Otro aviso.', 'Avisos silenciados.']);

    vi.advanceTimersByTime(1500);
    expect(messages()).toContain('Avisos silenciados.');

    vi.advanceTimersByTime(2600);
    expect(messages()).not.toContain('Avisos silenciados.');
  });
});
