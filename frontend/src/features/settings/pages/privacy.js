import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { showToast } from '@/components/primitives/toast.js';
import { createBlockedAccounts } from '@/components/settings/blocked-accounts.js';
import { createPrivacyControls } from '@/components/settings/privacy-controls.js';
import { createSettingsRow } from '@/components/settings/settings-row.js';
import { createSettingsSection } from '@/components/settings/settings-section.js';
import { h } from '@/lib/dom.js';
import { requestDataDownload, unblockAccount, updatePrivacy } from '@/services/settings.js';
import { mountSettingsPage } from '@/features/settings/settings-page.js';
import { createSettingsRail } from '@/components/settings/settings-rail.js';
import { openConfirm, openDeleteAccount, openPasswordDialog } from '@/features/settings/dialogs.js';

/**
 * D29 / M22 — Privacidad, bloqueos y seguridad básica.
 * Los switches se guardan al instante. Hacer público el perfil pide
 * confirmación; si el guardado falla, el switch revierte.
 */
export function createPage({ router } = {}) {
  return mountSettingsPage({
    active: 'privacidad',
    subtitle: 'Privacidad, historias y seguridad',
    router,
    createContent: ({ data, refresh, onDeleted, onLoggedOut }) =>
      createPrivacyContent({ data, refresh, onDeleted, onLoggedOut }),
    createRail: ({ data, refresh }) =>
      createSettingsRail({
        section: 'privacidad',
        data,
        onUnblock: (account) => requestUnblock({ account, refresh }),
      }),
  });
}

function createPrivacyContent({ data, refresh, onDeleted }) {
  const controls = createPrivacyControls({
    privacy: data.privacidad,
    onChange: (key, next) => changePrivacy({ key, next, refresh }),
  });

  const privacySection = createSettingsSection({
    title: 'Privacidad del perfil',
    description: 'Controla quién puede ver tu perfil y contactarte.',
    children: controls.element,
  });

  const passwordRow = createSettingsRow({
    title: 'Contraseña',
    description: 'Último cambio hace 3 meses.',
    control: createButton({
      label: 'Actualizar',
      variant: 'secondary',
      size: 'sm',
      onClick: () => openPasswordDialog(),
    }).element,
  });

  const securitySection = createSettingsSection({
    title: 'Seguridad',
    description: 'Protege el acceso a tu cuenta.',
    children: h('div', { class: 'ps-settings-rows' }, passwordRow),
  });

  const blocked = createBlockedAccounts({
    accounts: data.bloqueados,
    onUnblock: (account) => requestUnblock({ account, refresh }),
  });

  const blockedSection = createSettingsSection({
    title: 'Cuentas bloqueadas',
    description: 'Su contenido y sus mensajes no aparecen para ti.',
    children: blocked.element,
  });
  blockedSection.id = 'bloqueos';

  const download = createButton({
    label: 'Descargar mis datos',
    variant: 'secondary',
    iconLeft: createIcon('download', { size: 18 }),
    onClick: async () => {
      download.setLoading(true);

      try {
        const result = await requestDataDownload();
        showToast(result?.mensaje || 'Preparamos tu descarga.');
      } catch (error) {
        showToast(error?.message || 'No pudimos preparar la descarga.', { variant: 'error' });
      } finally {
        download.setLoading(false);
      }
    },
  });

  const dataSection = createSettingsSection({
    title: 'Datos y cuenta',
    description: 'Descarga una copia o elimina tu cuenta.',
    danger: true,
    children: h(
      'div',
      { class: 'ps-settings-data-actions' },
      h(
        'div',
        { class: 'ps-settings-data-actions__download' },
        createIcon('download', { size: 18 }),
        download.element,
      ),
      h(
        'button',
        {
          class: 'ps-settings-danger-action',
          type: 'button',
          onClick: () =>
            openDeleteAccount({
              handle: data.cuenta.handle,
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
    privacySection,
    blockedSection,
    securitySection,
    dataSection,
  );
}

function changePrivacy({ key, next, refresh }) {
  if (key === 'perfilPublico' && next) {
    return new Promise((resolve, reject) => {
      openConfirm({
        title: 'Hacer público el perfil',
        description:
          'Cualquier persona podrá ver la información de tu mascota, sus publicaciones y sus historias.',
        confirmLabel: 'Hacer público',
        onConfirm: async () => {
          await updatePrivacy({ perfilPublico: true });
          await refresh();
          showToast('El perfil ahora es público.');
        },
      }).result.then((confirmed) => {
        if (confirmed) {
          resolve();
        } else {
          reject(new Error('Cambio cancelado.'));
        }
      });
    });
  }

  return updatePrivacy({ [key]: next }).then(async () => {
    await refresh();
    showToast('Preferencia guardada.');
  });
}

function requestUnblock({ account, refresh }) {
  openConfirm({
    title: `Desbloquear a ${account.nombre}`,
    description:
      'Su contenido volverá a aparecer en el feed y podrá enviarte mensajes si tu privacidad lo permite.',
    confirmLabel: 'Desbloquear',
    onConfirm: async () => {
      await unblockAccount(account.handle);
      await refresh();
      showToast(`${account.nombre} ya no está bloqueada.`);
    },
  });
}
