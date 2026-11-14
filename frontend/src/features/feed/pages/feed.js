import { createButton } from '@/components/primitives/button.js';
import { createThemeToggle } from '@/components/primitives/theme-toggle.js';
import { h } from '@/lib/dom.js';
import { logout } from '@/services/auth.js';
import { getCurrentPet } from '@/services/pets.js';

/**
 * Placeholder de D13 / M06.
 * Confirma que la sesión quedó activa, muestra la mascota seleccionada y
 * permite cambiar de mascota o salir sin callejones sin salida.
 */
export function createPage({ router } = {}) {
  const pet = getCurrentPet();

  const changePet = createButton({
    label: 'Cambiar mascota',
    variant: 'secondary',
    onClick: () => router.navigate('/elegir-mascota'),
  });

  const exit = createButton({
    label: 'Cerrar sesión',
    variant: 'ghost',
    onClick: () => {
      logout();
      router.navigate('/', { replace: true });
    },
  });

  return h(
    'main',
    { id: 'contenido', class: 'ps-placeholder' },
    createThemeToggle().element,
    h('p', {
      class: 'ps-placeholder__eyebrow',
      text: pet ? `Entraste como ${pet.nombre}` : 'Sesión activa',
    }),
    h('h1', { class: 'ps-placeholder__title', text: 'Tu feed va aquí' }),
    h('p', {
      class: 'ps-placeholder__text',
      text: pet
        ? `El feed, las historias y las publicaciones de ${pet.nombre} se implementan en el siguiente bloque.`
        : 'El feed, las historias y las publicaciones se implementan en el siguiente bloque.',
    }),
    h('div', { class: 'ps-placeholder__actions' }, changePet.element, exit.element),
  );
}
