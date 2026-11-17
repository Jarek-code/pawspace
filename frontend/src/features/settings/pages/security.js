import { createButton } from '@/components/primitives/button.js';
import { createIcon } from '@/components/primitives/icon.js';
import { createModal } from '@/components/primitives/modal.js';
import { showToast } from '@/components/primitives/toast.js';
import { createReportList } from '@/components/settings/report-list.js';
import { createSettingsRow } from '@/components/settings/settings-row.js';
import { createSettingsSection } from '@/components/settings/settings-section.js';
import { h } from '@/lib/dom.js';
import { appealReport, updateFilters } from '@/services/settings.js';
import { mountSettingsPage } from '@/features/settings/settings-page.js';
import { createSettingsRail } from '@/components/settings/settings-rail.js';
import { openCommunityNorms } from '@/features/settings/dialogs.js';

const ESTADOS = {
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  EN_REVISION: { label: 'En revisión', tone: 'warning' },
  RESUELTO: { label: 'Resuelto', tone: 'success' },
  RECHAZADO: { label: 'Rechazado', tone: 'neutral' },
  APELADO: { label: 'Apelado', tone: 'info' },
};

/**
 * D30 / M23 — Centro de seguridad.
 * Reportes con estado y cronología, filtros de contenido y normas. Apelar
 * solo está disponible en reportes resueltos o rechazados.
 */
export function createPage({ router } = {}) {
  return mountSettingsPage({
    active: 'seguridad',
    subtitle: 'Reportes, filtros y normas',
    router,
    createContent: ({ data, refresh }) => createSecurityContent({ data, refresh }),
    createRail: ({ data, refresh }) =>
      createSettingsRail({
        section: 'seguridad',
        data,
        onOpenReport: (report) => openReportDetail({ report, refresh }),
      }),
  });
}

function createSecurityContent({ data, refresh }) {
  const reports = createReportList({
    reports: data.reportes,
    onOpen: (report) => openReportDetail({ report, refresh }),
  });

  const reportsSection = createSettingsSection({
    title: 'Reportes enviados',
    description: 'Sigue el estado de lo que has reportado.',
    children: reports.element,
  });

  const filters = [
    createSettingsRow({
      variant: 'switch',
      title: 'Ocultar comentarios ofensivos',
      description: 'Filtra automáticamente lenguaje hiriente.',
      checked: data.filtros.ocultarComentariosOfensivos,
      onChange: (next) => changeFilter({ key: 'ocultarComentariosOfensivos', next, refresh }),
    }),
    createSettingsRow({
      variant: 'switch',
      title: 'Filtrar palabras clave',
      description: 'Oculta publicaciones con palabras que elijas.',
      checked: data.filtros.filtrarPalabrasClave,
      onChange: (next) => changeFilter({ key: 'filtrarPalabrasClave', next, refresh }),
    }),
    createSettingsRow({
      variant: 'switch',
      title: 'Ocultar cuentas sin foto',
      description: 'No muestra perfiles sin imagen.',
      checked: data.filtros.ocultarCuentasSinFoto,
      onChange: (next) => changeFilter({ key: 'ocultarCuentasSinFoto', next, refresh }),
    }),
  ];

  const filtersSection = createSettingsSection({
    title: 'Filtros de contenido',
    description: 'Reduce lo que no quieres ver en el feed.',
    children: h('div', { class: 'ps-settings-rows' }, filters),
  });

  const normsSection = createSettingsSection({
    title: 'Normas de la comunidad',
    description: 'Conoce qué contenido está permitido y cómo apelar una decisión.',
    children: h(
      'div',
      { class: 'ps-settings-norms-card' },
      createIcon('shield', { size: 22 }),
      h('p', {
        text: 'Revisamos cada reporte con la cronología completa. Puedes apelar una decisión resuelta o rechazada.',
      }),
      createButton({
        label: 'Leer normas',
        variant: 'secondary',
        onClick: () => openCommunityNorms(),
      }).element,
    ),
  });

  return h('div', { class: 'ps-settings-page' }, reportsSection, filtersSection, normsSection);
}

function changeFilter({ key, next, refresh }) {
  return updateFilters({ [key]: next }).then(async () => {
    await refresh();
    showToast('Filtro actualizado.');
  });
}

function openReportDetail({ report, refresh }) {
  const estado = ESTADOS[report.estado] || ESTADOS.PENDIENTE;
  const canAppeal = ['RESUELTO', 'RECHAZADO'].includes(report.estado);
  let appealButton = null;

  if (canAppeal) {
    appealButton = createButton({
      label: 'Apelar decisión',
      variant: 'secondary',
      onClick: async () => {
        appealButton.setLoading(true);

        try {
          await appealReport(report.id);
          modal.close();
          await refresh();
          showToast('Recibimos tu apelación. Te avisaremos cuando haya una respuesta.');
        } catch (error) {
          showToast(error?.message || 'No pudimos enviar la apelación.', { variant: 'error' });
          appealButton.setLoading(false);
        }
      },
    });
  }

  const modal = createModal({
    title: report.titulo,
    description: report.objetivo,
    children: h(
      'div',
      { class: 'ps-report-detail' },
      h(
        'div',
        { class: 'ps-report-detail__head' },
        h('span', { class: `ps-status-pill ps-status-pill--${estado.tone}`, text: estado.label }),
        h('span', { class: 'ps-report-detail__date', text: report.fecha }),
      ),
      h('p', { class: 'ps-report-detail__body', text: report.detalle }),
      h('h3', { class: 'ps-report-detail__title', text: 'Cronología' }),
      h(
        'ol',
        { class: 'ps-report-detail__timeline' },
        report.cronologia.map((item) =>
          h(
            'li',
            { class: 'ps-report-detail__event' },
            h('span', { class: 'ps-report-detail__event-date', text: item.fecha }),
            h('span', { class: 'ps-report-detail__event-text', text: item.texto }),
          ),
        ),
      ),
      h(
        'div',
        { class: 'ps-settings-dialog__actions' },
        createButton({
          label: 'Cerrar',
          variant: 'secondary',
          onClick: () => modal.close(),
        }).element,
        appealButton?.element,
      ),
    ),
  });

  document.body.append(modal.element);
  modal.open();
  return modal;
}
