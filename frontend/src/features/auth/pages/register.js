import { createAuthCard } from '@/components/layout/auth-card.js';
import { createAuthLayout } from '@/components/layout/auth-layout.js';
import { createBrandPanel } from '@/components/layout/brand-panel.js';
import { createAlert } from '@/components/primitives/alert.js';
import { createButton } from '@/components/primitives/button.js';
import { createField, createPasswordField } from '@/components/primitives/field.js';
import { createPasswordStrength } from '@/components/primitives/password-strength.js';
import { messages, validateRegistration } from '@/features/auth/validation.js';
import { ApiError } from '@/lib/errors.js';
import { h } from '@/lib/dom.js';
import { registerAndLogin } from '@/services/auth.js';
import './register.css';

/**
 * D02 / D02b / M02 — Crear cuenta de la persona.
 * Al crear la cuenta se inicia sesión y se continúa al onboarding de la
 * primera mascota. La mascota nunca se registra en este formulario.
 */
export function createPage({ router } = {}) {
  let busy = false;

  const alert = createAlert({ variant: 'error' });

  const nameField = createField({
    name: 'nombre',
    label: 'Nombre completo',
    autocomplete: 'name',
    placeholder: 'Tu nombre',
    icon: 'user',
    required: true,
    onInput: () => {
      nameField.clearError();
      alert.hide();
    },
  });

  const emailField = createField({
    name: 'email',
    label: 'Correo electrónico',
    type: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    placeholder: 'nombre@correo.com',
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
    autocomplete: 'new-password',
    placeholder: 'Tu contraseña',
    required: true,
    onInput: () => {
      passwordField.clearError();
      strength.update(passwordField.getValue());
      alert.hide();
    },
  });

  const strength = createPasswordStrength();
  const passwordHelp = h('p', {
    class: 'ps-field__help',
    text: 'Usa 8 caracteres o más.',
  });
  passwordField.element.append(strength.element, passwordHelp);

  const confirmField = createPasswordField({
    name: 'confirm',
    label: 'Confirma tu contraseña',
    autocomplete: 'new-password',
    placeholder: 'Repite tu contraseña',
    required: true,
    onInput: () => {
      confirmField.clearError();
      alert.hide();
    },
  });

  const termsInput = h('input', { type: 'checkbox', id: 'ps-terms', name: 'terms' });
  const termsError = h('p', {
    class: 'ps-field__message',
    id: 'ps-terms-message',
    attrs: { role: 'alert' },
  });
  const terms = h(
    'label',
    { class: 'ps-checkbox ps-checkbox--terms', for: 'ps-terms' },
    termsInput,
    h(
      'span',
      { class: 'ps-checkbox__label' },
      'Acepto los ',
      h('a', { href: '#terminos' }, 'Términos de uso'),
      ' y el ',
      h('a', { href: '#privacidad' }, 'Aviso de privacidad'),
      '.',
    ),
  );
  termsInput.setAttribute('aria-describedby', 'ps-terms-message');

  const submit = createButton({
    label: 'Crear cuenta',
    type: 'submit',
    size: 'lg',
    fullWidth: true,
    loadingLabel: 'Creando cuenta…',
  });

  const form = h(
    'form',
    {
      class: 'ps-auth-form ps-register-form',
      novalidate: true,
      attrs: { 'aria-label': 'Crear cuenta' },
    },
    nameField.element,
    emailField.element,
    passwordField.element,
    confirmField.element,
    h('div', { class: 'ps-register-form__terms' }, terms, termsError),
    alert.element,
    h('div', { class: 'ps-auth-form__submit' }, submit.element),
  );

  const footer = h(
    'p',
    { class: 'ps-auth-form__footer' },
    '¿Ya tienes cuenta? ',
    h('a', { href: '/' }, 'Entra'),
  );

  const card = createAuthCard({
    title: 'Crea tu cuenta',
    subtitle: 'Primero tú. Después le toca a tu mascota.',
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
    nameField.setDisabled(next);
    emailField.setDisabled(next);
    passwordField.setDisabled(next);
    confirmField.setDisabled(next);
    termsInput.disabled = next;
    form.setAttribute('aria-busy', String(next));
  }

  function showError(title, body) {
    alert.show(title, body);
    alert.focus();
  }

  function setTermsError(message) {
    termsError.textContent = message;

    if (message) {
      termsInput.setAttribute('aria-invalid', 'true');
      terms.classList.add('is-invalid');
    } else {
      termsInput.removeAttribute('aria-invalid');
      terms.classList.remove('is-invalid');
    }
  }

  termsInput.addEventListener('change', () => {
    setTermsError('');
    alert.hide();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    nameField.clearError();
    emailField.clearError();
    passwordField.clearError();
    confirmField.clearError();
    setTermsError('');
    alert.hide();

    const values = {
      nombre: nameField.getValue().trim(),
      email: emailField.getValue().trim(),
      password: passwordField.getValue(),
      confirm: confirmField.getValue(),
      terms: termsInput.checked,
    };
    const errors = validateRegistration(values);

    if (Object.keys(errors).length > 0) {
      if (errors.nombre) {
        nameField.setError(errors.nombre);
      }

      if (errors.email) {
        emailField.setError(errors.email);
      }

      if (errors.password) {
        passwordField.setError(errors.password);
      }

      if (errors.confirm) {
        confirmField.setError(errors.confirm);
      }

      if (errors.terms) {
        setTermsError(errors.terms);
      }

      const first = errors.nombre
        ? nameField
        : errors.email
          ? emailField
          : errors.password
            ? passwordField
            : errors.confirm
              ? confirmField
              : termsInput;
      first.focus();
      return;
    }

    setBusy(true);

    try {
      await registerAndLogin({
        nombre: values.nombre,
        email: values.email,
        password: values.password,
        remember: true,
      });
      await router.navigate('/onboarding/especie', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 409)) {
        emailField.setInvalid(true);
        showError('Ese correo ya está registrado', 'Entra con tu cuenta o usa otro correo.');
      } else if (error instanceof ApiError && error.status === 422) {
        showError('Revisa los datos', error.message);
      } else if (error instanceof ApiError && error.status === 0) {
        showError('No pudimos conectar', messages.network);
      } else {
        showError('No pudimos crear tu cuenta', error.message || 'Intenta de nuevo.');
      }
    } finally {
      setBusy(false);
    }
  });

  return layout;
}
