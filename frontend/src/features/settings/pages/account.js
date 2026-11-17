import { createButton } from '@/components/primitives/button.js';
import { createField, createTextareaField } from '@/components/primitives/field.js';
import { createAvatar } from '@/components/primitives/avatar.js';
import { createIcon } from '@/components/primitives/icon.js';
import { showToast } from '@/components/primitives/toast.js';
import { createSettingsSection } from '@/components/settings/settings-section.js';
import { h } from '@/lib/dom.js';
import { closeAllSessions, closeSession, updateAccount } from '@/services/settings.js';
import { mountSettingsPage } from '@/features/settings/settings-page.js';
import { createSettingsRail } from '@/components/settings/settings-rail.js';
import { openConfirm, openDeleteAccount } from '@/features/settings/dialogs.js';

/**
 * D28 / M21 — Configuración, cuenta.
 * Formulario con validación al salir y al guardar, sesiones y zona de peligro
 * separada. En móvil las sesiones viven bajo el formulario.
 */
export function createPage({ router } = {}) {
  return mountSettingsPage({
    active: 'cuenta',
    subtitle: 'Cuenta, privacidad y seguridad',
    router,
    createContent: ({ data, refresh, onDeleted, onLoggedOut }) =>
      createAccountContent({ data, refresh, router, onDeleted, onLoggedOut }),
    createRail: ({ data, refresh, onLoggedOut }) =>
      createSettingsRail({
        section: 'cuenta',
        data,
        onCloseSession: (session) => requestCloseSession({ session, onLoggedOut, refresh }),
        onCloseAll: () => requestCloseAll({ onLoggedOut }),
        onUnblock: null,
      }),
  });
}

function createAccountContent({ data, refresh, onDeleted, onLoggedOut }) {
  const { cuenta, sesiones } = data;
  const avatar = createAvatar({
    name: cuenta.nombre,
    src: cuenta.avatar,
    size: 'lg',
  });

  const nombre = createField({
    label: 'Nombre',
    value: cuenta.nombre,
    autocomplete: 'name',
    requiredMark: true,
  });
  const email = createField({
    label: 'Correo electrónico',
    type: 'email',
    value: cuenta.email,
    autocomplete: 'email',
    inputmode: 'email',
    requiredMark: true,
  });
  const telefono = createField({
    label: 'Teléfono',
    type: 'tel',
    value: cuenta.telefono,
    autocomplete: 'tel',
    inputmode: 'tel',
  });
  const ubicacion = createField({
    label: 'Ubicación',
    value: cuenta.ubicacion,
    autocomplete: 'address-level2',
  });
  const bio = createTextareaField({
    label: 'Biografía',
    value: cuenta.bio,
    rows: 3,
    maxlength: 300,
  });

  const file = h('input', {
    class: 'ps-settings-avatar__file',
    type: 'file',
    accept: 'image/png,image/jpeg,image/webp',
    attrs: { 'aria-label': 'Elegir foto de perfil' },
  });
  file.hidden = true;

  const avatarButton = createButton({
    label: 'Cambiar foto',
    variant: 'ghost',
    size: 'sm',
    onClick: () => file.click(),
  });

  file.addEventListener('change', async () => {
    const selected = file.files?.[0];

    if (!selected) {
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      showToast('La foto debe pesar menos de 2 MB.', { variant: 'error' });
      return;
    }

    try {
      const nextAvatar = await readAsDataUrl(selected);
      await updateAccount({ avatar: nextAvatar });
      await refresh();
      showToast('Foto actualizada.');
    } catch (error) {
      showToast(error?.message || 'No pudimos actualizar la foto.', { variant: 'error' });
    } finally {
      file.value = '';
    }
  });

  const save = createButton({
    label: 'Guardar cambios',
    onClick: async () => {
      clearErrors([nombre, email, bio]);

      if (!nombre.getValue().trim()) {
        nombre.setError('Escribe tu nombre.');
        nombre.focus();
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.getValue().trim())) {
        email.setError('Escribe un correo electrónico válido.');
        email.focus();
        return;
      }

      save.setLoading(true);

      try {
        await updateAccount({
          nombre: nombre.getValue().trim(),
          email: email.getValue().trim(),
          telefono: telefono.getValue().trim(),
          ubicacion: ubicacion.getValue().trim(),
          bio: bio.getValue().trim(),
        });
        await refresh();
        showToast('Cambios guardados.');
      } catch (error) {
        const message = error?.message || 'No pudimos guardar los cambios.';
        showToast(message, { variant: 'error' });

        if (/correo/i.test(message)) {
          email.setError(message);
          email.focus();
        }
      } finally {
        save.setLoading(false);
      }
    },
  });

  const cancel = createButton({
    label: 'Cancelar',
    variant: 'secondary',
    onClick: () => refresh(),
  });

  const summary = h(
    'div',
    { class: 'ps-settings-account-summary' },
    avatar,
    h(
      'span',
      { class: 'ps-settings-account-summary__text' },
      h('span', { class: 'ps-settings-account-summary__name', text: cuenta.nombre }),
      h('span', { class: 'ps-settings-account-summary__email', text: cuenta.email }),
      h('span', { class: 'ps-settings-account-summary__handle', text: cuenta.handle }),
    ),
    createButton({
      label: 'Editar',
      variant: 'ghost',
      size: 'sm',
      onClick: () => nombre.focus(),
    }).element,
  );

  const identity = h(
    'div',
    { class: 'ps-settings-identity' },
    avatar,
    h(
      'div',
      { class: 'ps-settings-identity__info' },
      h('span', { class: 'ps-settings-identity__name', text: cuenta.nombre }),
      h('span', { class: 'ps-settings-identity__email', text: cuenta.email }),
    ),
    h(
      'div',
      { class: 'ps-settings-identity__actions' },
      avatarButton.element,
      file,
      createButton({
        label: 'Editar nombre',
        variant: 'ghost',
        size: 'sm',
        onClick: () => nombre.focus(),
      }).element,
    ),
  );

  const personal = createSettingsSection({
    title: 'Datos personales',
    description: 'Esta información aparece en tu cuenta, no en el perfil de tu mascota.',
    children: h(
      'div',
      { class: 'ps-settings-form' },
      summary,
      identity,
      nombre.element,
      email.element,
      telefono.element,
      ubicacion.element,
      bio.element,
      h('div', { class: 'ps-settings-form__actions' }, save.element, cancel.element),
    ),
  });

  const sessionsSection = createSettingsSection({
    title: 'Sesiones activas',
    description: 'Cierra las sesiones que no reconozcas.',
    children: h(
      'ul',
      { class: 'ps-settings-sessions ps-settings-sessions--mobile' },
      sesiones.map((session) =>
        h(
          'li',
          { class: 'ps-settings-session' },
          h(
            'span',
            { class: 'ps-settings-session__text' },
            h('span', { class: 'ps-settings-session__device', text: session.dispositivo }),
            h('span', {
              class: 'ps-settings-session__meta',
              text: `${session.ubicacion} · ${session.tiempo}`,
            }),
          ),
          h(
            'button',
            {
              class: 'ps-settings-session__close',
              type: 'button',
              attrs: { 'aria-label': `Cerrar sesión de ${session.dispositivo}` },
              onClick: () => requestCloseSession({ session, onLoggedOut, refresh }),
            },
            'Cerrar',
          ),
        ),
      ),
      h(
        'li',
        { class: 'ps-settings-sessions__all' },
        h(
          'button',
          {
            class: 'ps-settings-rail__danger-link',
            type: 'button',
            onClick: () => requestCloseAll({ onLoggedOut }),
          },
          'Cerrar todas las sesiones',
        ),
      ),
    ),
  });

  const danger = createSettingsSection({
    title: 'Cuenta',
    description: `Miembro desde ${cuenta.miembroDesde}.`,
    danger: true,
    children: h(
      'div',
      { class: 'ps-settings-rows' },
      h(
        'button',
        {
          class: 'ps-settings-danger-action',
          type: 'button',
          onClick: () => requestCloseAll({ onLoggedOut }),
        },
        createIcon('log-out', { size: 18 }),
        h('span', { text: 'Cerrar sesión en todos los dispositivos' }),
      ),
      h(
        'button',
        {
          class: 'ps-settings-danger-action',
          type: 'button',
          onClick: () =>
            openDeleteAccount({
              handle: cuenta.handle,
              onDeleted,
            }),
        },
        createIcon('trash-2', { size: 18 }),
        h('span', { text: 'Eliminar cuenta' }),
      ),
    ),
  });

  return h(
    'div',
    { class: 'ps-settings-page' },
    personal,
    h('div', { class: 'ps-settings-mobile-only' }, sessionsSection),
    danger,
  );
}

function requestCloseSession({ session, onLoggedOut, refresh }) {
  openConfirm({
    title: session.actual ? 'Cerrar tu sesión actual' : `Cerrar sesión de ${session.dispositivo}`,
    description: session.actual
      ? 'Se cerrará la sesión en este dispositivo y volverás al acceso.'
      : 'La sesión se cerrará en ese dispositivo. Puedes volver a iniciar sesión cuando quieras.',
    confirmLabel: session.actual ? 'Cerrar sesión' : 'Cerrar esa sesión',
    danger: session.actual,
    onConfirm: async () => {
      await closeSession(session.id);

      if (session.actual) {
        onLoggedOut?.();
      } else {
        await refresh();
        showToast('Sesión cerrada.');
      }
    },
  });
}

function requestCloseAll({ onLoggedOut }) {
  openConfirm({
    title: 'Cerrar todas las sesiones',
    description:
      'Se cerrará la sesión en todos los dispositivos, incluido este. Tendrás que volver a entrar.',
    confirmLabel: 'Cerrar todas',
    danger: true,
    onConfirm: async () => {
      await closeAllSessions();
      onLoggedOut?.();
    },
  });
}

function clearErrors(fields) {
  fields.forEach((field) => field.clearError());
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No pudimos leer la imagen.'));
    reader.readAsDataURL(file);
  });
}
