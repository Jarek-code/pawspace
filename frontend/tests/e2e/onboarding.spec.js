import { expect, test } from '@playwright/test';

async function registerAndGoToOnboarding(page) {
  const email = `onboarding.${Date.now()}@example.com`;
  await page.goto('/registro');
  await page.getByLabel('Nombre completo').fill('Sofía Ramírez');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Pawspace2026');
  await page.getByLabel('Confirma tu contraseña', { exact: true }).fill('Pawspace2026');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL('/onboarding/especie');
}

async function chooseSpecies(page, title) {
  await page.getByText(title, { exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
}

test.describe('Onboarding de la mascota', () => {
  test('recorre los cuatro pasos y entra con la mascota creada', async ({ page }) => {
    await registerAndGoToOnboarding(page);

    await chooseSpecies(page, 'Gato');
    await expect(page).toHaveURL('/onboarding/datos');

    const username = `miel.${Date.now()}`;
    await page.getByLabel('Nombre (obligatorio)').fill('Miel');
    await page.getByLabel('Nombre de usuario (obligatorio)').fill(username);
    await page.getByRole('combobox', { name: 'Raza' }).fill('Siamés');
    await page.getByRole('option', { name: /Siamés/ }).click();
    await page.getByLabel('Sexo').selectOption('Hembra');
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page).toHaveURL('/onboarding/perfil');
    await page.getByRole('button', { name: 'Omitir por ahora' }).click();

    await expect(page).toHaveURL('/onboarding/privacidad');
    await page.getByText('Perfil privado.', { exact: true }).click();
    await page.getByRole('button', { name: 'Terminar' }).click();

    await expect(page).toHaveURL('/onboarding/listo');
    await expect(page.getByRole('heading', { name: '¡Miel ya tiene su espacio!' })).toBeVisible();

    await page.getByRole('button', { name: 'Entrar a PawSpace' }).click();
    await expect(page).toHaveURL('/inicio');
    await expect(page.getByText('Entraste como Miel')).toBeVisible();

    await page.getByRole('button', { name: 'Cambiar mascota' }).click();
    await expect(page).toHaveURL('/elegir-mascota');
    await expect(page.getByRole('heading', { name: '¿Con quién vas a entrar?' })).toBeVisible();
    await expect(page.getByText('Miel', { exact: true }).first()).toBeVisible();
  });

  test('permite buscar una especie fuera de perro, gato y ave', async ({ page }) => {
    await registerAndGoToOnboarding(page);

    await chooseSpecies(page, 'Otra especie');
    await expect(page).toHaveURL('/onboarding/especie/otra');

    await page.getByRole('combobox').fill('cone');
    await page.getByRole('option', { name: /Conejo/ }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    await expect(page).toHaveURL('/onboarding/datos');
  });

  test('no permite continuar sin elegir especie', async ({ page }) => {
    await registerAndGoToOnboarding(page);

    const next = page.getByRole('button', { name: 'Continuar' });
    await expect(next).toBeDisabled();
  });
});
