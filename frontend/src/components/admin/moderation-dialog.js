import { createButton } from '@/components/primitives/button.js';
import { createTextareaField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';

/**
 * CMP-98 — ModerationDialog.
 * Confirmación destructiva con motivo obligatorio (10–500 caracteres). Se usa
 * para ocultar o eliminar contenido y para suspender cuentas. El motivo queda
 * en el historial y el botón de confirmar permanece deshabilitado hasta que sea
 * válido.
 */
export function openModerationDialog({
  titulo,
  cuerpo,
  advertencia = null,
  confirmLabel = 'Confirmar',
  variante = 'danger',
  fieldLabel = 'Motivo',
  onConfirm,
} = {}) {
  const motivo = createTextareaField({
    label: fieldLabel,
    placeholder: 'Explica la decisión. Quedará en el historial.',
    rows: 4,
    maxlength: 500,
    required: true,
    requiredMark: true,
  });

  const confirm = createButton({
    label: confirmLabel,
    variant: variante,
    onClick: async () => {
      const valor = motivo.getValue().trim();

      if (valor.length < 10) {
        motivo.setError('Escribe un motivo de al menos 10 caracteres.');
        motivo.focus();
        return;
      }

      motivo.clearError();
      confirm.setLoading(true);

      try {
        await onConfirm(valor);
        modal.close();
      } catch (error) {
        showToast(error?.message || 'No pudimos completar la acción.', { variant: 'error' });
      } finally {
        confirm.setLoading(false);
      }
    },
  });

  const cancel = createButton({
    label: 'Cancelar',
    variant: 'ghost',
    onClick: () => modal.close(),
  });

  confirm.element.disabled = true;

  motivo.input.addEventListener('input', () => {
    confirm.element.disabled = motivo.getValue().trim().length < 10;
  });

  const children = h(
    'div',
    { class: 'ps-moderation' },
    cuerpo ? h('p', { class: 'ps-moderation__body', text: cuerpo }) : null,
    advertencia
      ? h(
          'div',
          { class: 'ps-moderation__warning', role: 'note' },
          h(
            'span',
            { class: 'ps-moderation__warning-icon', 'aria-hidden': 'true' },
            createIcon('warning', { size: 20 }),
          ),
          h('p', { class: 'ps-moderation__warning-text', text: advertencia }),
        )
      : null,
    motivo.element,
    h('div', { class: 'ps-moderation__actions' }, cancel.element, confirm.element),
  );

  const modal = createModal({
    title: titulo,
    children,
  });

  document.body.append(modal.element);
  modal.open();

  return modal;
}
