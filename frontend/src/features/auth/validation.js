/**
 * Validación del formulario de acceso.
 *
 * Los mensajes viven en un solo lugar para que la pantalla y las pruebas usen
 * el mismo texto. El backend sigue siendo la fuente de verdad de credenciales.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const messages = {
  nameRequired: 'Escribe tu nombre completo.',
  emailRequired: 'Escribe tu correo electrónico.',
  emailInvalid: 'Escribe un correo electrónico válido.',
  passwordRequired: 'Escribe tu contraseña.',
  passwordMin: 'La contraseña debe tener 8 caracteres o más.',
  passwordWeak: 'Usa al menos una letra y un número.',
  passwordMismatch: 'Las contraseñas no coinciden.',
  termsRequired: 'Acepta los términos para continuar.',
  credentials: 'El correo o la contraseña no son correctos.',
  inactive: 'Esta cuenta está desactivada. Escríbenos a soporte si necesitas ayuda.',
  network: 'Revisa tu conexión e inténtalo de nuevo.',
  usernameRequired: 'Elige un nombre de usuario.',
  usernameInvalid: 'Usa entre 3 y 30 caracteres: letras, números, punto o guion bajo.',
  usernameTaken: 'Ese nombre de usuario ya está ocupado. Prueba con otro.',
  petNameRequired: 'Escribe el nombre de tu mascota.',
  speciesRequired: 'Elige una especie para continuar.',
};

export function validateEmail(value) {
  const email = String(value || '').trim();

  if (!email) {
    return messages.emailRequired;
  }

  if (!EMAIL_PATTERN.test(email)) {
    return messages.emailInvalid;
  }

  return '';
}

export function validatePassword(value) {
  if (!String(value || '')) {
    return messages.passwordRequired;
  }

  return '';
}

export function validateLogin({ email, password } = {}) {
  const errors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  if (emailError) {
    errors.email = emailError;
  }

  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

export function validateName(value) {
  const name = String(value || '').trim();

  if (!name) {
    return messages.nameRequired;
  }

  if (name.length < 2) {
    return messages.nameRequired;
  }

  return '';
}

export function isStrongPassword(value) {
  const password = String(value || '');
  return password.length >= 8 && /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) && /\d/.test(password);
}

export function validateRegistration({ nombre, email, password, confirm, terms } = {}) {
  const errors = {};
  const nameError = validateName(nombre);
  const emailError = validateEmail(email);
  const passwordText = String(password || '');
  const confirmText = String(confirm || '');

  if (nameError) {
    errors.nombre = nameError;
  }

  if (emailError) {
    errors.email = emailError;
  }

  if (!passwordText) {
    errors.password = messages.passwordRequired;
  } else if (passwordText.length < 8) {
    errors.password = messages.passwordMin;
  } else if (!isStrongPassword(passwordText)) {
    errors.password = messages.passwordWeak;
  }

  if (!confirmText) {
    errors.confirm = messages.passwordMismatch;
  } else if (confirmText !== passwordText) {
    errors.confirm = messages.passwordMismatch;
  }

  if (!terms) {
    errors.terms = messages.termsRequired;
  }

  return errors;
}

export function validateUsername(value) {
  const username = String(value || '').trim();

  if (!username) {
    return messages.usernameRequired;
  }

  if (!/^[A-Za-z0-9._]{3,30}$/.test(username)) {
    return messages.usernameInvalid;
  }

  return '';
}

export function validatePetName(value) {
  return String(value || '').trim() ? '' : messages.petNameRequired;
}
