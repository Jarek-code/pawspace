import { describe, expect, it } from 'vitest';
import {
  messages,
  validateEmail,
  validateLogin,
  validateName,
  validatePassword,
  validatePetName,
  validateRegistration,
  validateUsername,
} from '@/features/auth/validation.js';

describe('validateEmail', () => {
  it('pide el correo cuando está vacío', () => {
    expect(validateEmail('')).toBe(messages.emailRequired);
    expect(validateEmail('   ')).toBe(messages.emailRequired);
  });

  it('rechaza correos sin forma válida', () => {
    expect(validateEmail('sofia')).toBe(messages.emailInvalid);
    expect(validateEmail('sofia@')).toBe(messages.emailInvalid);
    expect(validateEmail('sofia@example')).toBe(messages.emailInvalid);
  });

  it('acepta un correo válido con espacios alrededor', () => {
    expect(validateEmail(' sofia.ramirez@example.com ')).toBe('');
  });
});

describe('validatePassword', () => {
  it('pide la contraseña cuando está vacía', () => {
    expect(validatePassword('')).toBe(messages.passwordRequired);
  });

  it('acepta cualquier contraseña no vacía', () => {
    expect(validatePassword('Pawspace2026')).toBe('');
  });
});

describe('validateLogin', () => {
  it('devuelve los dos errores cuando el formulario está vacío', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: messages.emailRequired,
      password: messages.passwordRequired,
    });
  });

  it('devuelve un objeto vacío con datos válidos', () => {
    expect(validateLogin({ email: 'sofia.ramirez@example.com', password: 'Pawspace2026' })).toEqual(
      {},
    );
  });
});

describe('validateRegistration', () => {
  it('pide nombre, correo y contraseña cuando está vacío', () => {
    const errors = validateRegistration({
      nombre: '',
      email: '',
      password: '',
      confirm: '',
      terms: false,
    });

    expect(errors.nombre).toBe(messages.nameRequired);
    expect(errors.email).toBe(messages.emailRequired);
    expect(errors.password).toBe(messages.passwordRequired);
    expect(errors.confirm).toBe(messages.passwordMismatch);
    expect(errors.terms).toBe(messages.termsRequired);
  });

  it('exige una contraseña de al menos 8 caracteres', () => {
    expect(validateRegistration({ password: 'abcdefg', confirm: 'abcdefg' }).password).toBe(
      messages.passwordMin,
    );
  });

  it('acepta una contraseña de 8 caracteres sin exigir variedad', () => {
    expect(validateRegistration({ password: 'abcdefgh', confirm: 'abcdefgh' }).password).toBe(
      undefined,
    );
  });

  it('rechaza confirmaciones que no coinciden', () => {
    expect(
      validateRegistration({ password: 'Pawspace2026', confirm: 'Pawspace2027' }).confirm,
    ).toBe(messages.passwordMismatch);
  });

  it('acepta un registro válido', () => {
    expect(
      validateRegistration({
        nombre: 'Sofía',
        email: 'sofia@example.com',
        password: 'Pawspace2026',
        confirm: 'Pawspace2026',
        terms: true,
      }),
    ).toEqual({});
  });
});

describe('validateUsername', () => {
  it('rechaza nombres vacíos, cortos o con caracteres no permitidos', () => {
    expect(validateUsername('')).toBe(messages.usernameRequired);
    expect(validateUsername('ab')).toBe(messages.usernameInvalid);
    expect(validateUsername('luna paw')).toBe(messages.usernameInvalid);
  });

  it('acepta letras, números, punto y guion bajo', () => {
    expect(validateUsername('luna.paws')).toBe('');
    expect(validateUsername('tobias_golden2')).toBe('');
  });
});

describe('validatePetName', () => {
  it('pide el nombre de la mascota', () => {
    expect(validatePetName('')).toBe(messages.petNameRequired);
    expect(validatePetName('Luna')).toBe('');
  });
});

describe('validateName', () => {
  it('pide un nombre de al menos 2 caracteres', () => {
    expect(validateName('')).toBe(messages.nameRequired);
    expect(validateName('A')).toBe(messages.nameRequired);
    expect(validateName('Sofía Ramírez')).toBe('');
  });
});
