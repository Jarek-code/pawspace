import { expect, test } from '@playwright/test';

const EMAIL = 'sofia.ramirez@example.com';
const PASSWORD = 'Pawspace2026';

async function login(page) {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill(EMAIL);
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/inicio');
  await expect(page.getByText('Comparte algo de')).toBeVisible();
}

test.describe('Feed', () => {
  test('escritorio: sidebar, contenido y riel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    await expect(page.locator('.ps-sidebar')).toBeVisible();
    await expect(page.locator('.ps-rail')).toBeVisible();
    await expect(page.locator('.ps-bottom-nav')).toBeHidden();
    await expect(page.locator('.ps-post-card').first()).toBeVisible();
    await expect(page.getByText('Sugerencias para seguir')).toBeVisible();
    await expect(page.getByText('Tendencias')).toBeVisible();
  });

  test('móvil: top bar, bottom nav y FAB; sin sidebar ni riel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await expect(page.locator('.ps-sidebar')).toBeHidden();
    await expect(page.locator('.ps-rail')).toBeHidden();
    await expect(page.locator('.ps-bottom-nav')).toBeVisible();
    await expect(page.locator('.ps-bottom-nav__fab')).toBeVisible();
    await expect(page.locator('.ps-feed-tabs')).toBeVisible();
  });

  test('tablet: sidebar en riel de iconos, sin riel', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await login(page);

    await expect(page.locator('.ps-sidebar')).toBeVisible();
    await expect(page.locator('.ps-rail')).toBeHidden();
    await expect(page.locator('.ps-bottom-nav')).toBeHidden();
  });

  test('celular en horizontal usa tablet o chrome compacto según el puntero', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await login(page);

    if (testInfo.project.name === 'mobile') {
      await expect(page.locator('.ps-sidebar')).toBeHidden();
      await expect(page.locator('.ps-topbar__menu')).toBeVisible();
    } else {
      await expect(page.locator('.ps-sidebar')).toBeVisible();
    }

    await expect(page.locator('.ps-bottom-nav')).toBeHidden();
    await expect(page.locator('.ps-rail')).toBeHidden();
  });

  test('el tema oscuro se aplica al feed', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await login(page);

    await page.getByRole('button', { name: 'Activar tema oscuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('compartir: republica y aparece en el feed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    await page.getByRole('button', { name: 'Compartir' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Compartir publicación' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Republicar/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Enviar por mensaje/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Copiar enlace/ })).toBeVisible();

    await dialog.getByRole('button', { name: /Republicar/ }).click();

    await expect(page.getByText('Republicaste la publicación.')).toBeVisible();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.ps-post-card__reposted').first()).toBeVisible();
  });

  test('compartir: lista conversaciones para enviar por mensaje', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    await page.getByRole('button', { name: 'Compartir' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Compartir publicación' });
    await dialog.getByRole('button', { name: /Enviar por mensaje/ }).click();

    await expect(dialog.getByLabel('Buscar conversación')).toBeVisible();
    await expect(dialog.locator('.ps-share-dialog__recipient').first()).toBeVisible();
    await dialog.getByLabel('Buscar conversación').fill('Milo');
    await expect(dialog.locator('.ps-share-dialog__recipient')).toHaveCount(1);
  });
});

test.describe('Crear publicación', () => {
  test('escritorio: modal D14 publica y vuelve al feed', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    await page.getByRole('button', { name: 'Crear publicación' }).first().click();
    await expect(page).toHaveURL('/publicar');
    await expect(page.getByRole('dialog', { name: 'Crear publicación' })).toBeVisible();

    await page
      .getByPlaceholder('¿Qué está pasando con Luna?')
      .fill('Estrenando el nuevo rincón de siestas.');
    await page.getByRole('button', { name: 'Publicar' }).click();

    await expect(page).toHaveURL('/inicio');
    await expect(
      page.locator('#contenido').getByText('Estrenando el nuevo rincón de siestas.'),
    ).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Crear publicación' })).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('escritorio: volver con el navegador cierra el modal y libera el scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    await page.getByRole('button', { name: 'Crear publicación' }).first().click();
    await expect(page).toHaveURL('/publicar');
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');

    await page.goBack();

    await expect(page).toHaveURL('/inicio');
    await expect(page.getByRole('dialog', { name: 'Crear publicación' })).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('móvil: M07 ocupa la pantalla y publica', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await page.locator('.ps-bottom-nav__fab').click();
    await expect(page).toHaveURL('/publicar');
    await expect(page.locator('.ps-compose-page')).toBeVisible();
    await expect(page.locator('.ps-modal')).toHaveCount(0);

    await page.getByPlaceholder('¿Qué está pasando con Luna?').fill('Paseo corto, siesta larga.');
    await page.getByRole('button', { name: 'Publicar' }).click();

    await expect(page).toHaveURL('/inicio');
    await expect(page.getByText('Paseo corto, siesta larga.')).toBeVisible();
  });
});

test.describe('Detalle de publicación', () => {
  test('escritorio: D15 muestra comentarios y agrega uno', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    await page.locator('.ps-post-card').first().locator('.ps-post-card__body').click();
    await expect(page).toHaveURL('/publicacion/post_luna_1');
    await expect(page.getByRole('heading', { name: 'Comentarios' })).toBeVisible();
    await expect(page.getByText('Ese rincón es el mejor. Lo confirmo.')).toBeVisible();

    await page.getByLabel('Escribe un comentario').fill('Yo también quiero ese rayo de sol.');
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText('Yo también quiero ese rayo de sol.')).toBeVisible();
    await expect(page.locator('.ps-comments__count')).toHaveText('4');
  });

  test('móvil: M08 vuelve al feed con la flecha del topbar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);

    await page.locator('.ps-post-card').first().locator('.ps-post-card__body').click();
    await expect(page).toHaveURL('/publicacion/post_luna_1');
    await expect(page.locator('.ps-bottom-nav')).toBeHidden();
    await expect(page.locator('.ps-comment-form')).toBeVisible();

    await page.getByRole('link', { name: 'Volver' }).click();
    await expect(page).toHaveURL('/inicio');
  });
});
