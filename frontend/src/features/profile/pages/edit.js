import { createAppShell } from '@/components/layout/app-shell.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { showToast } from '@/components/primitives/toast.js';
import { createEditProfileForm } from '@/components/profile/edit-profile-form.js';
import { createProfilePreview } from '@/components/profile/profile-preview.js';
import { h } from '@/lib/dom.js';
import { currentSession, logout } from '@/services/auth.js';
import { activatePet, getCurrentPet, listPets, updatePet } from '@/services/pets.js';
import { loadOwnProfile, updateOwnProfile } from '@/services/profiles.js';
import { accountFromEmail } from '@/features/feed/feed-view.js';
import { createProfileLoading } from '@/features/profile/profile-view.js';

/**
 * D18 / M11 — Editar perfil.
 * La portada no se edita: no existe en el esquema. El avatar se optimiza a
 * data URL para que el mock sobreviva a la recarga.
 */
export function createPage({ router } = {}) {
  const stored = getCurrentPet() || listPets(currentSession().email)[0] || null;
  const pet = stored ? { ...stored, handle: `@${stored.usuario}` } : null;
  const account = accountFromEmail(currentSession().email);

  const shell = createAppShell({
    activePath: '/perfil',
    title: 'Editar perfil',
    subtitle: 'Actualiza la identidad de tu mascota',
    pet,
    account,
    backTo: '/perfil',
    notificationCount: 3,
    onSearch: (query) => goSearch(router, query),
    onLogout: () => {
      logout();
      router.navigate('/', { replace: true });
    },
    rail: h('span', { class: 'ps-sr-only', text: 'Cargando vista previa…' }),
    children: createProfileLoading(),
  });

  const content = shell.querySelector('.ps-shell__content');
  const rail = shell.querySelector('.ps-rail');

  loadOwnProfile()
    .then((profile) => {
      const preview = createProfilePreview(profile);

      const form = createEditProfileForm({
        profile,
        onPreview: (next) => preview.update({ ...profile, ...next }),
        onCancel: () => router.navigate('/perfil'),
        onSubmit: async (payload) => {
          await updateOwnProfile(payload);

          try {
            const updated = updatePet(profile.id, payload);

            if (updated) {
              activatePet(updated);
            }
          } catch (error) {
            showToast(error?.message || 'No pudimos guardar el nombre de usuario.', {
              variant: 'error',
            });
            throw error;
          }

          showToast('Cambios guardados.');
          router.navigate('/perfil');
        },
      });

      content.replaceChildren(form.element);
      rail.replaceChildren(preview.element);
    })
    .catch(() => {
      rail.replaceChildren();
      content.replaceChildren(
        createEmptyState({
          icon: 'alert',
          title: 'No pudimos cargar el perfil',
          body: 'Revisa tu conexión e intenta de nuevo.',
          action: createButton({
            label: 'Volver al perfil',
            variant: 'secondary',
            onClick: () => router.navigate('/perfil'),
          }).element,
        }),
      );
    });

  return shell;
}

function goSearch(router, query) {
  const clean = String(query || '').trim();
  router.navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/buscar');
}
