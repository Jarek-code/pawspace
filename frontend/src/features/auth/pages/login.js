import { createAuthCard } from '@/components/layout/auth-card.js';
import { createAuthLayout } from '@/components/layout/auth-layout.js';
import { createBrandPanel } from '@/components/layout/brand-panel.js';
import { createAlert } from '@/components/primitives/alert.js';
import { createButton } from '@/components/primitives/button.js';
import { createCheckbox, createField, createPasswordField } from '@/components/primitives/field.js';
import { messages, validateLogin } from '@/features/auth/validation.js';
import { ApiError } from '@/lib/errors.js';
import { h } from '@/lib/dom.js';
import { login } from '@/services/auth.js';
import './login.css';

/**
 * D01 / M01 — Entrar a PawSpace.
 *
 * La persona inicia sesión; la mascota activa se elige después. Los errores de
 * credenciales usan un mensaje neutro para no revelar si el correo existe.
 */
export function createPage({ router } = {}) {
  let busy = false;

  const alert = createAlert({ variant: 'error' });

  const emailField = createField({
    name: 'email',
    label: 'Correo electrónico',
    type: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    placeholder: 'tu@correo.com',
    icon: 'mail',
    required: true,
    onInput: () => {
      emailField.clearError();
      alert.hide();
    },
  });

  const passwordField = createPasswordField({
    name: 'password',
    label: 'Contraseña',
    autocomplete: 'current-password',
    placeholder: 'Tu contraseña',
    required: true,
    onInput: () => {
      passwordField.clearError();
      alert.hide();
    },
  });

  const remember = createCheckbox({
    name: 'remember',
    label: 'Mantener sesión iniciada',
    checked: true,
  });

  const submit = createButton({
    label: 'Entrar',
    type: 'submit',
    size: 'lg',
    fullWidth: true,
    loadingLabel: 'Entrando…',
  });

  const form = h(
    'form',
    {
      class: 'ps-auth-form',
      novalidate: true,
      attrs: { 'aria-label': 'Entrar a PawSpace' },
    },
    emailField.element,
    passwordField.element,
    remember.element,
    alert.element,
    h('div', { class: 'ps-auth-form__submit' }, submit.element),
  );

  const footer = h(
    'p',
    { class: 'ps-auth-form__footer' },
    '¿Aún no tienes cuenta? ',
    h('a', { href: '/registro' }, 'Crea una'),
  );

  const card = createAuthCard({
    title: 'Entra a PawSpace',
    subtitle: 'Administra el espacio de tus mascotas.',
    children: form,
    footer,
  });

  const layout = createAuthLayout({
    brand: createBrandPanel(),
    children: card,
  });

  function setBusy(next) {
    busy = next;
    submit.setLoading(next);
    submit.setDisabled(next);
    emailField.setDisabled(next);
    passwordField.setDisabled(next);
    remember.input.disabled = next;
    form.setAttribute('aria-busy', String(next));
  }

  function showError(title, body) {
    alert.show(title, body);
    alert.focus();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    emailField.clearError();
    passwordField.clearError();
    alert.hide();

    const email = emailField.getValue().trim();
    const password = passwordField.getValue();
    const errors = validateLogin({ email, password });

    if (errors.email || errors.password) {
      if (errors.email) {
        emailField.setError(errors.email);
      }

      if (errors.password) {
        passwordField.setError(errors.password);
      }

      (errors.email ? emailField : passwordField).focus();
      return;
    }

    setBusy(true);

    try {
      await login({ email, password, remember: remember.getValue() });
      await router.navigate('/inicio', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        showError('Cuenta desactivada', messages.inactive);
      } else if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
        emailField.setInvalid(true);
        passwordField.setInvalid(true);
        showError('No pudimos entrar', messages.credentials);
      } else if (error instanceof ApiError && error.status === 0) {
        showError('No pudimos conectar', messages.network);
      } else {
        showError('No pudimos entrar', error.message || messages.credentials);
      }
    } finally {
      setBusy(false);
    }
  });

  return layout;
}
