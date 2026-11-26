import { expect, test } from '@playwright/test';

const USER = { email: 'sofia.ramirez@example.com', password: 'Pawspace2026' };

async function login(page) {
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill(USER.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(USER.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL('/inicio');
}

async function openMenu(page) {
  const trigger = page
    .getByRole('button', { name: 'Menú de cuenta' })
    .filter({ visible: true })
    .first();

  await trigger.click();
  await expect(page.getByRole('menu', { name: 'Opciones de cuenta' })).toBeVisible();
  return trigger;
}

test.describe('Menú de cuenta', () => {
  test('muestra la identidad y abre ayuda', async ({ page }) => {
    await login(page);
    await openMenu(page);

    const panel = page.locator('.ps-account-menu__panel.is-open');
    await expect(panel.locator('.ps-account-menu__pet-name')).toHaveText('Luna');
    await expect(panel.locator('.ps-account-menu__pet-handle')).toHaveText('@luna');
    await expect(panel.locator('.ps-account-menu__person')).toHaveText('Sofia Ramirez');
    await expect(panel.locator('.ps-account-menu__email')).toHaveText('sofia.ramirez@example.com');

    await page.getByRole('menuitem', { name: 'Ayuda y soporte' }).click();
    await expect(page).toHaveURL('/ayuda');
  });

  test('cierra sesión desde el menú', async ({ page }) => {
    await login(page);
    await openMenu(page);

    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Entra a PawSpace' })).toBeVisible();
  });

  test('el menú se cierra con Escape', async ({ page }) => {
    await login(page);
    const trigger = await openMenu(page);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'Opciones de cuenta' })).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('abre el menú desde el nombre o el correo del sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);

    const accountInfo = page.getByRole('button', {
      name: 'Abrir menú de cuenta de Sofia Ramirez',
    });
    await expect(accountInfo).toBeVisible();
    await accountInfo.click();

    const menu = page.getByRole('menu', { name: 'Opciones de cuenta' });
    await expect(menu).toBeVisible();
    await expect(accountInfo).toHaveAttribute('aria-expanded', 'true');

    const triggerBox = await page
      .locator('.ps-sidebar__account .ps-account-menu__trigger')
      .boundingBox();
    const panelBox = await page.locator('.ps-account-menu__panel.is-open').boundingBox();

    expect(panelBox.x).toBeGreaterThanOrEqual(triggerBox.x - 2);
    expect(panelBox.x).toBeLessThanOrEqual(triggerBox.x + 2);

    await page.keyboard.press('Escape');
    await expect(accountInfo).toBeFocused();
  });
});
