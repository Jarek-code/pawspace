import { createButton } from '@/components/primitives/button.js';
import { createEmptyState } from '@/components/primitives/empty-state.js';
import {
  createField,
  createSelectField,
  createTextareaField,
} from '@/components/primitives/field.js';
import { showToast } from '@/components/primitives/toast.js';
import { h } from '@/lib/dom.js';
import {
  loadAdminArticle,
  loadAdminCategories,
  saveAdminArticle,
  setAdminArticleStatus,
} from '@/services/admin.js';

/**
 * CMP-105 — ArticleEditor (D43).
 * Edición simple con campos, textarea de contenido y vista previa de lectura.
 */
export function createArticleEditor({ router, id = null, refresh }) {
  const root = h('div', { class: 'ps-article-editor' });

  function load() {
    root.replaceChildren(
      h('div', {
        class: 'ps-report-detail__loading',
        attrs: { role: 'status', 'aria-live': 'polite' },
      }),
    );

    Promise.all([id ? loadAdminArticle(id) : Promise.resolve(null), loadAdminCategories()])
      .then(([article, categoriesPayload]) => {
        root.replaceChildren(render(article, categoriesPayload.categorias));
      })
      .catch(() => {
        root.replaceChildren(
          createEmptyState({
            icon: 'alert',
            title: 'No pudimos cargar el editor',
            body: 'Revisa tu conexión e intenta de nuevo.',
            action: createButton({
              label: 'Volver a ayuda',
              variant: 'secondary',
              onClick: () => router.navigate('/admin/ayuda'),
            }).element,
          }),
        );
      });
  }

  function render(article, categorias) {
    const categoria = createSelectField({
      label: 'Categoría',
      required: true,
      requiredMark: true,
      options: categorias.map((item) => ({ value: item.id, label: item.nombre })),
    });
    categoria.setValue(article?.categoriaId || categorias[0]?.id || '');

    const slug = createField({
      label: 'Slug',
      required: true,
      requiredMark: true,
      value: article?.slug || '',
      placeholder: 'como-cambiar-tu-contrasena',
    });

    const titulo = createField({
      label: 'Título',
      required: true,
      requiredMark: true,
      value: article?.titulo || '',
    });

    const resumen = createTextareaField({
      label: 'Resumen',
      rows: 2,
      maxlength: 220,
      required: true,
      requiredMark: true,
      value: article?.resumen || '',
    });

    const contenido = createTextareaField({
      label: 'Contenido',
      rows: 10,
      required: true,
      requiredMark: true,
      value: article?.contenido || '',
      help: 'Un párrafo por línea. La vista previa se actualiza mientras escribes.',
    });

    const minutos = createField({
      label: 'Minutos de lectura',
      type: 'number',
      value: String(article?.minutos || 4),
    });

    const orden = createField({
      label: 'Orden',
      type: 'number',
      value: String(article?.orden || 1),
    });

    const previewTitulo = h('h3', {
      class: 'ps-article-preview__title',
      text: article?.titulo || 'Título del artículo',
    });
    const previewResumen = h('p', {
      class: 'ps-article-preview__summary',
      text: article?.resumen || 'Resumen del artículo.',
    });
    const previewBody = h('div', { class: 'ps-article-preview__body' });

    function updatePreview() {
      previewTitulo.textContent = titulo.getValue().trim() || 'Título del artículo';
      previewResumen.textContent = resumen.getValue().trim() || 'Resumen del artículo.';
      previewBody.replaceChildren(
        ...contenido
          .getValue()
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => h('p', { class: 'ps-article-preview__paragraph', text: line })),
      );
    }

    [titulo, resumen, contenido].forEach((field) =>
      field.input.addEventListener('input', updatePreview),
    );
    updatePreview();

    function submit(estado) {
      const data = {
        id,
        titulo: titulo.getValue(),
        categoriaId: categoria.getValue(),
        resumen: resumen.getValue(),
        contenido: contenido.getValue(),
        minutos: minutos.getValue(),
        orden: orden.getValue(),
        slug: slug.getValue(),
        estado,
      };

      return saveAdminArticle(data)
        .then(() => {
          showToast(estado === 'PUBLICADO' ? 'Artículo publicado.' : 'Borrador guardado.', {
            variant: 'success',
          });
          refresh?.();
          router.navigate('/admin/ayuda');
        })
        .catch((error) => {
          const mensaje = error?.message || 'No pudimos guardar el artículo.';
          slug.setError(mensaje);
          slug.focus();
          showToast(mensaje, { variant: 'error' });
        });
    }

    const guardarBorrador = createButton({
      label: 'Guardar borrador',
      variant: 'secondary',
      onClick: () => submit('BORRADOR'),
    });

    const publicar = createButton({
      label: 'Publicar artículo',
      variant: 'primary',
      onClick: () => submit('PUBLICADO'),
    });

    const retirar = article
      ? createButton({
          label: 'Retirar artículo',
          variant: 'ghost',
          onClick: () =>
            setAdminArticleStatus(id, 'RETIRADO')
              .then(() => {
                showToast('Artículo retirado.', { variant: 'success' });
                refresh?.();
                router.navigate('/admin/ayuda');
              })
              .catch((error) =>
                showToast(error?.message || 'No pudimos retirar el artículo.', {
                  variant: 'error',
                }),
              ),
        })
      : null;

    return h(
      'div',
      { class: 'ps-article-editor__inner' },
      h(
        'div',
        { class: 'ps-report-detail__head' },
        h('a', { class: 'ps-report-detail__back', href: '/admin/ayuda', text: 'Volver a ayuda' }),
        h(
          'div',
          { class: 'ps-report-detail__heading' },
          h('h2', {
            class: 'ps-report-detail__title',
            text: article ? 'Editar artículo' : 'Nuevo artículo',
          }),
          h('p', {
            class: 'ps-report-detail__subtitle',
            text: article
              ? 'Los cambios se reflejan en el centro de ayuda.'
              : 'Crea un borrador y publícalo cuando esté listo.',
          }),
        ),
      ),
      h(
        'div',
        { class: 'ps-article-editor__columns' },
        h(
          'form',
          {
            class: 'ps-admin-panel ps-article-editor__form',
            onSubmit: (event) => event.preventDefault(),
          },
          h(
            'div',
            { class: 'ps-article-editor__row' },
            categoria.element,
            minutos.element,
            orden.element,
          ),
          slug.element,
          titulo.element,
          resumen.element,
          contenido.element,
          h(
            'div',
            { class: 'ps-article-editor__actions' },
            retirar ? retirar.element : null,
            guardarBorrador.element,
            publicar.element,
          ),
        ),
        h(
          'aside',
          { class: 'ps-admin-panel ps-article-preview', attrs: { 'aria-label': 'Vista previa' } },
          h('p', { class: 'ps-report-detail__card-title', text: 'Vista previa' }),
          previewTitulo,
          previewResumen,
          previewBody,
        ),
      ),
    );
  }

  load();

  return root;
}
