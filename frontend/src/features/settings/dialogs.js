import { createButton } from '@/components/primitives/button.js';
import { createField, createPasswordField } from '@/components/primitives/field.js';
import { createModal } from '@/components/primitives/modal.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import { changePassword, deleteAccount } from '@/services/settings.js';

export function openConfirm({
  title = 'Confirmar',
  description = '',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel = null,
} = {}) {
  let settle = () => {};
  const result = new Promise((resolve) => {
    settle = resolve;
  });

  const cancel = createButton({
    label: cancelLabel,
    variant: 'secondary',
    onClick: () => {
      modal.close();
      onCancel?.();
      settle(false);
    },
  });

  const confirm = createButton({
    label: confirmLabel,
    variant: danger ? 'danger' : 'primary',
    onClick: async () => {
      confirm.setLoading(true);

      try {
        await onConfirm?.();
        modal.close();
        settle(true);
      } catch (error) {
        showToast(error?.message || 'No pudimos completar la acción.', { variant: 'error' });
        confirm.setLoading(false);
        settle(false);
      }
    },
  });

  const modal = createModal({
    title,
    description,
    children: h('div', { class: 'ps-settings-dialog__actions' }, cancel.element, confirm.element),
  });

  document.body.append(modal.element);
  modal.open();
  return { ...modal, result };
}

export function openDeleteAccount({ handle = '@sofia', onDeleted = null } = {}) {
  const field = createField({
    label: `Escribe ${handle} para confirmar`,
    placeholder: handle,
    autocomplete: 'off',
  });

  const cancel = createButton({
    label: 'Cancelar',
    variant: 'secondary',
    onClick: () => modal.close(),
  });

  const confirm = createButton({
    label: 'Eliminar cuenta',
    variant: 'danger',
    onClick: async () => {
      confirm.setLoading(true);

      try {
        await deleteAccount(handle);
        modal.close();
        onDeleted?.();
      } catch (error) {
        showToast(error?.message || 'No pudimos eliminar la cuenta.', { variant: 'error' });
        confirm.setLoading(false);
      }
    },
  });

  field.input.addEventListener('input', () => {
    confirm.element.disabled = field.input.value.trim().toLowerCase() !== handle.toLowerCase();
  });
  confirm.element.disabled = true;

  const modal = createModal({
    title: 'Eliminar cuenta',
    description:
      'Esta acción no se puede deshacer. Se eliminarán tus mascotas, tus publicaciones y tus historias.',
    children: h(
      'div',
      { class: 'ps-settings-dialog' },
      field.element,
      h('p', {
        class: 'ps-settings-dialog__note',
        text: 'Si tienes reportes abiertos, te pediremos una confirmación adicional.',
      }),
      h('div', { class: 'ps-settings-dialog__actions' }, cancel.element, confirm.element),
    ),
  });

  document.body.append(modal.element);
  modal.open();
  return modal;
}

export function openPasswordDialog() {
  const actual = createPasswordField({
    label: 'Contraseña actual',
    autocomplete: 'current-password',
    requiredMark: true,
  });
  const nueva = createPasswordField({
    label: 'Contraseña nueva',
    autocomplete: 'new-password',
    help: 'Al menos 8 caracteres.',
    requiredMark: true,
  });
  const repetir = createPasswordField({
    label: 'Repite la contraseña nueva',
    autocomplete: 'new-password',
    requiredMark: true,
  });

  function validate() {
    actual.clearError();
    nueva.clearError();
    repetir.clearError();

    if (!actual.getValue()) {
      actual.setError('Escribe tu contraseña actual.');
      actual.focus();
      return false;
    }

    if (nueva.getValue().length < 8) {
      nueva.setError('Usa al menos 8 caracteres.');
      nueva.focus();
      return false;
    }

    if (nueva.getValue() !== repetir.getValue()) {
      repetir.setError('Las contraseñas no coinciden.');
      repetir.focus();
      return false;
    }

    return true;
  }

  const cancel = createButton({
    label: 'Cancelar',
    variant: 'secondary',
    onClick: () => modal.close(),
  });

  const save = createButton({
    label: 'Guardar contraseña',
    onClick: async () => {
      if (!validate()) {
        return;
      }

      save.setLoading(true);

      try {
        await changePassword({
          actual: actual.getValue(),
          nueva: nueva.getValue(),
        });
        modal.close();
        showToast('Contraseña actualizada. Cerramos las demás sesiones.');
      } catch (error) {
        const message = error?.message || 'No pudimos cambiar la contraseña.';
        showToast(message, { variant: 'error' });

        if (/actual/i.test(message)) {
          actual.setError(message);
          actual.focus();
        } else {
          nueva.setError(message);
        }

        save.setLoading(false);
      }
    },
  });

  const modal = createModal({
    title: 'Actualizar contraseña',
    description: 'Pide tu contraseña actual y cierra las demás sesiones al guardar.',
    children: h(
      'div',
      { class: 'ps-settings-dialog' },
      actual.element,
      nueva.element,
      repetir.element,
      h('div', { class: 'ps-settings-dialog__actions' }, cancel.element, save.element),
    ),
  });

  document.body.append(modal.element);
  modal.open();
  return modal;
}

export function openCommunityNorms() {
  const modal = createModal({
    title: 'Normas de la comunidad',
    description: 'Estas reglas mantienen PawSpace seguro para todas las mascotas.',
    children: h(
      'div',
      { class: 'ps-settings-norms' },
      h('h3', { text: 'Contenido permitido' }),
      h('p', {
        text: 'Comparte momentos de tus mascotas con respeto. Las fotos y textos deben ser propios o tener permiso.',
      }),
      h('h3', { text: 'Contenido que no permitimos' }),
      h('p', {
        text: 'Acoso, suplantación, spam, violencia, contenido sexual y material que vulnere derechos de autor.',
      }),
      h('h3', { text: 'Cómo apelar' }),
      h('p', {
        text: 'Si un reporte se resolvió o rechazó, abre su detalle y elige Apelar. Revisaremos la decisión con la cronología completa.',
      }),
      h(
        'div',
        { class: 'ps-settings-dialog__actions' },
        createButton({
          label: 'Entendido',
          onClick: () => modal.close(),
        }).element,
      ),
    ),
  });

  document.body.append(modal.element);
  modal.open();
  return modal;
}
