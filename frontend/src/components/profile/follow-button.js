import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';

/**
 * CMP-60 — FollowButton.
 * Botón Seguir / Siguiendo / Solicitud enviada.
 * Optimista: cambia de estado al instante y revierte si la API falla.
 */
export function createFollowButton({
  siguiendo = false,
  pendiente = false,
  privado = false,
  onToggle,
  onError,
} = {}) {
  const state = { siguiendo, pendiente };

  function labelFor(next) {
    if (next.pendiente) {
      return 'Solicitud enviada';
    }

    return next.siguiendo ? 'Siguiendo' : 'Seguir';
  }

  const button = createButton({
    label: labelFor(state),
    variant: state.siguiendo || state.pendiente ? 'secondary' : 'primary',
    size: 'md',
    iconLeft: createIcon(state.siguiendo || state.pendiente ? 'check' : 'user-plus', {
      size: 18,
    }),
  });

  function sync(next) {
    state.siguiendo = Boolean(next.siguiendo);
    state.pendiente = Boolean(next.pendiente);
    button.setLabel(labelFor(state));
    button.element.classList.toggle('ps-button--secondary', state.siguiendo || state.pendiente);
    button.element.classList.toggle('ps-button--primary', !state.siguiendo && !state.pendiente);
    button.element.setAttribute('aria-pressed', String(state.siguiendo || state.pendiente));
    const iconHost = button.element.querySelector('.ps-button__icon');

    if (iconHost) {
      iconHost.replaceChildren(
        createIcon(state.siguiendo || state.pendiente ? 'check' : 'user-plus', { size: 18 }),
      );
    }
  }

  button.element.addEventListener('click', async () => {
    const previous = { ...state };

    if (state.pendiente || state.siguiendo) {
      sync({ siguiendo: false, pendiente: false });
    } else {
      sync({ siguiendo: !privado, pendiente: privado });
    }

    button.setLoading(true);

    try {
      const result = await onToggle?.();
      sync(result || state);
    } catch (error) {
      sync(previous);
      onError?.(error);
    } finally {
      button.setLoading(false);
    }
  });

  button.element.setAttribute('aria-pressed', String(state.siguiendo || state.pendiente));

  return {
    element: button.element,
    setState: sync,
  };
}
