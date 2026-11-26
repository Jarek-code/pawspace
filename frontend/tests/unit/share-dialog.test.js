import { afterEach, describe, expect, it, vi } from 'vitest';
import { openShareDialog, postUrl } from '@/components/feed/share-dialog.js';

const post = {
  id: 'post_luna_1',
  mascota: { nombre: 'Luna', handle: '@luna' },
  texto: 'Hoy encontré el rayo de sol perfecto para una siesta.',
  media: null,
};

const pet = { nombre: 'Luna', handle: '@luna' };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('openShareDialog', () => {
  it('abre la ventana con las tres acciones y el enlace correcto', () => {
    const modal = openShareDialog({ post, pet });

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    const titles = Array.from(document.querySelectorAll('.ps-share-dialog__option-title')).map(
      (node) => node.textContent,
    );

    expect(titles).toEqual(['Republicar', 'Enviar por mensaje', 'Copiar enlace']);
    expect(postUrl(post)).toBe(`${window.location.origin}/publicacion/post_luna_1`);

    modal.close();
  });

  it('copia el enlace y muestra un aviso', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const modal = openShareDialog({ post, pet });
    const copy = Array.from(document.querySelectorAll('.ps-share-dialog__option')).find((button) =>
      button.textContent.includes('Copiar enlace'),
    );

    copy.click();
    await Promise.resolve();

    expect(writeText).toHaveBeenCalledWith(postUrl(post));
    expect(document.querySelector('.ps-toast__message')?.textContent).toContain('Enlace copiado');

    modal.close();
  });

  it('muestra las conversaciones al elegir enviar por mensaje', async () => {
    const modal = openShareDialog({ post, pet });
    const send = Array.from(document.querySelectorAll('.ps-share-dialog__option')).find((button) =>
      button.textContent.includes('Enviar por mensaje'),
    );

    send.click();
    await vi.waitFor(() => {
      expect(document.querySelectorAll('.ps-share-dialog__recipient').length).toBeGreaterThan(0);
    });

    expect(document.querySelector('.ps-share-dialog__recipients').hidden).toBe(false);

    modal.close();
  });
});
