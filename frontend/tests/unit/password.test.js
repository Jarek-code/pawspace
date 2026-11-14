import { describe, expect, it } from 'vitest';
import { estimatePasswordStrength } from '@/lib/password.js';

describe('estimatePasswordStrength', () => {
  it('devuelve nivel none para una contraseña vacía', () => {
    expect(estimatePasswordStrength('').level).toBe('none');
    expect(estimatePasswordStrength(undefined).level).toBe('none');
    expect(estimatePasswordStrength(null).level).toBe('none');
  });

  it('marca como débil una combinación simple de letras y números', () => {
    expect(estimatePasswordStrength('abcd1234').level).toBe('weak');
    expect(estimatePasswordStrength('hola1234').level).toBe('weak');
  });

  it('marca como débil una contraseña de solo minúsculas', () => {
    expect(estimatePasswordStrength('abcdefgh').level).toBe('weak');
  });

  it('marca como media una contraseña con mayúsculas y minúsculas', () => {
    expect(estimatePasswordStrength('Pawspace').level).toBe('medium');
  });

  it('marca como segura una contraseña larga y variada', () => {
    expect(estimatePasswordStrength('Pawspace2026').level).toBe('strong');
  });

  it('marca como segura una frase larga', () => {
    expect(estimatePasswordStrength('correcthorsebatterystaple').level).toBe('strong');
  });

  it('fuerza a débil una contraseña muy común aunque su entropía sea alta', () => {
    expect(estimatePasswordStrength('Contraseña').level).toBe('weak');
  });
});
