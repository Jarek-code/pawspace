import { expect, test } from '@playwright/test';

const ADMIN = { email: 'mariana.ortega@pawspace.com', password: 'Pawspace2026' };
const USER = { email: 'sofia.ramirez@example.com', password: 'Pawspace2026' };

async function login(page, { email, password }) {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

async function openAdminMenu(page) {
  await page.locator('.ps-admin__account-summary:visible').click();
  return page.locator('.ps-admin__account-panel:visible');
}

async function openAppMenu(page) {
  const trigger = page
    .getByRole('button', { name: 'Menú de cuenta' })
    .filter({ visible: true })
    .first();
  await trigger.click();
  return page.getByRole('menu', { name: 'Opciones de cuenta' });
}

test.describe('Navegación entre administración y app', () => {
  test('abre el contenido reportado en la app normal', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL('/admin');

    await page.goto('/admin/reportes/1041');
    const link = page.getByRole('link', { name: 'Ver publicación' });
    await expect(link).toHaveAttribute('href', '/publicacion/post_toby_1');

    await link.click();
    await expect(page).toHaveURL('/publicacion/post_toby_1');
  });

  test('Ver perfil abre la ficha del usuario en administración', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL('/admin');
    await page.goto('/admin/reportes/1041');

    const profiles = page.locator('.ps-report-person__link');
    await expect(profiles).toHaveCount(2);
    await expect(profiles.nth(0)).toHaveAttribute('href', '/admin/usuarios/u_sofia');
    await expect(profiles.nth(1)).toHaveAttribute('href', '/admin/usuarios/u_ana');

    await profiles.nth(1).click();
    await expect(page).toHaveURL('/admin/usuarios/u_ana');
    await expect(page.getByRole('heading', { name: 'Cuenta de Ana Ruiz' })).toBeVisible();
  });

  test('el menú del admin lleva a su perfil de solo lectura y a la app', async ({ page }) => {
    await login(page, ADMIN);
    await expect(page).toHaveURL('/admin');

    let panel = await openAdminMenu(page);
    await panel.getByRole('link', { name: 'Ver mi perfil' }).click();
    await expect(page).toHaveURL('/perfil');
    await expect(page.getByRole('heading', { name: 'Michi', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Editar perfil' })).toHaveCount(0);

    const menu = await openAppMenu(page);
    await menu.getByRole('menuitem', { name: 'Panel de administración' }).click();
    await expect(page).toHaveURL('/admin');

    panel = await openAdminMenu(page);
    await panel.getByRole('link', { name: 'Ir a la app' }).click();
    await expect(page).toHaveURL('/inicio');
  });

  test('el menú normal no muestra administración a quien no es admin', async ({ page }) => {
    await login(page, USER);
    await expect(page).toHaveURL('/inicio');

    const menu = await openAppMenu(page);
    await expect(menu.getByRole('menuitem', { name: 'Panel de administración' })).toHaveCount(0);
  });
});
