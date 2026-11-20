import { createAdminStatus } from '@/components/admin/admin-status.js';
import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import { createField, createTextareaField } from '@/components/primitives/field.js';
import { createIcon } from '@/components/primitives/icon.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import {
  loadAdminCategories,
  moveAdminCategory,
  saveAdminCategory,
  toggleAdminCategory,
} from '@/services/admin.js';

/**
 * CMP-106 — CategoryManager (D44).
 * Categorías con nombre, slug, descripción, orden, estado y número de
 * artículos. Se activan, desactivan y reordenan; una categoría con artículos no
 * se elimina.
 */
export function createCategoryManager({ refresh }) {
  const state = {
    categorias: [],
    editingId: null,
    form: { nombre: '', slug: '', descripcion: '', orden: 1, activa: true },
  };

  const root = h('div', { class: 'ps-category-manager' });

  function load() {
    loadAdminCategories()
      .then((payload) => {
        state.categorias = payload.categorias;
        render();
      })
      .catch(() => {
        root.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar las categorías',
            body: 'Revisa tu conexión e intenta de nuevo.',
            action: createButton({
              label: 'Reintentar',
              variant: 'secondary',
              onClick: () => load(),
            }).element,
          }),
        );
      });
  }

  function render() {
    const nombre = createField({
      label: 'Nombre',
      required: true,
      requiredMark: true,
      value: state.form.nombre,
    });
    const slug = createField({
      label: 'Slug',
      value: state.form.slug,
      placeholder: 'cuenta-y-acceso',
    });
    const descripcion = createTextareaField({
      label: 'Descripción',
      rows: 2,
      maxlength: 200,
      value: state.form.descripcion,
    });
    const orden = createField({ label: 'Orden', type: 'number', value: String(state.form.orden) });

    const guardar = createButton({
      label: state.editingId ? 'Guardar cambios' : 'Crear categoría',
      variant: 'primary',
      onClick: () =>
        saveAdminCategory({
          id: state.editingId,
          nombre: nombre.getValue(),
          slug: slug.getValue(),
          descripcion: descripcion.getValue(),
          orden: orden.getValue(),
          activa: state.form.activa,
        })
          .then(() => {
            showToast(state.editingId ? 'Categoría actualizada.' : 'Categoría creada.', {
              variant: 'success',
            });
            estadoReset();
            refresh?.();
            load();
          })
          .catch((error) =>
            showToast(error?.message || 'No pudimos guardar la categoría.', { variant: 'error' }),
          ),
    });

    const nueva = createButton({
      label: 'Nueva categoría',
      variant: 'ghost',
      onClick: () => {
        estadoReset();
        render();
      },
    });

    const form = h(
      'form',
      {
        class: 'ps-admin-panel ps-category-manager__form',
        onSubmit: (event) => event.preventDefault(),
      },
      h('h3', {
        class: 'ps-report-detail__card-title',
        text: state.editingId ? 'Editar categoría' : 'Nueva categoría',
      }),
      nombre.element,
      slug.element,
      descripcion.element,
      h(
        'div',
        { class: 'ps-article-editor__row' },
        orden.element,
        h('div', { class: 'ps-category-manager__actions' }, nueva.element, guardar.element),
      ),
    );

    const lista = h(
      'section',
      { class: 'ps-admin-panel' },
      h('h3', { class: 'ps-report-detail__card-title', text: 'Categorías' }),
      h(
        'ul',
        { class: 'ps-admin-panel__list' },
        state.categorias.map((category) =>
          h(
            'li',
            {},
            h(
              'div',
              { class: 'ps-category-row' },
              h(
                'div',
                { class: 'ps-category-row__main' },
                h('span', { class: 'ps-category-row__name', text: category.nombre }),
                h('span', {
                  class: 'ps-category-row__meta',
                  text: `${category.slug} · ${category.articulos} artículos`,
                }),
              ),
              createAdminStatus(category.activa ? 'ACTIVA' : 'INACTIVA'),
              h(
                'div',
                { class: 'ps-category-row__actions' },
                createButton({
                  label: 'Editar',
                  variant: 'ghost',
                  size: 'sm',
                  onClick: () => {
                    state.editingId = category.id;
                    state.form = {
                      nombre: category.nombre,
                      slug: category.slug,
                      descripcion: category.descripcion,
                      orden: category.orden,
                      activa: category.activa,
                    };
                    render();
                  },
                }).element,
                createButton({
                  label: category.activa ? 'Desactivar' : 'Activar',
                  variant: 'ghost',
                  size: 'sm',
                  onClick: () =>
                    toggleAdminCategory(category.id)
                      .then(() => load())
                      .catch((error) =>
                        showToast(error?.message || 'No pudimos cambiar el estado.', {
                          variant: 'error',
                        }),
                      ),
                }).element,
                h(
                  'button',
                  {
                    class: 'ps-data-table__page',
                    type: 'button',
                    attrs: { 'aria-label': `Subir ${category.nombre}` },
                    onClick: () => moveAdminCategory(category.id, 'up').then(() => load()),
                  },
                  createIcon('chevron-left', { size: 16, className: 'ps-category-row__icon-up' }),
                ),
                h(
                  'button',
                  {
                    class: 'ps-data-table__page',
                    type: 'button',
                    attrs: { 'aria-label': `Bajar ${category.nombre}` },
                    onClick: () => moveAdminCategory(category.id, 'down').then(() => load()),
                  },
                  createIcon('chevron-right', {
                    size: 16,
                    className: 'ps-category-row__icon-down',
                  }),
                ),
              ),
            ),
          ),
        ),
      ),
    );

    root.replaceChildren(h('div', { class: 'ps-category-manager__inner' }, form, lista));
  }

  function estadoReset() {
    state.editingId = null;
    state.form = {
      nombre: '',
      slug: '',
      descripcion: '',
      orden: state.categorias.length + 1,
      activa: true,
    };
  }

  load();

  return root;
}
