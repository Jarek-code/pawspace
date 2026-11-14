/**
 * Estimación de fuerza de contraseña por entropía.
 *
 * bits = longitudEfectiva × log2(tamañoDelConjunto)
 *
 * El conjunto suma los caracteres presentes (minúsculas 26, mayúsculas 26,
 * dígitos 10, símbolos 33). La longitud efectiva resta repeticiones y
 * secuencias (como "aaaa" o "1234") porque no aportan entropía real.
 *
 * Niveles: < 40 bits "weak", 40–59 "medium", ≥ 60 "strong". Una contraseña
 * muy común se fuerza a "weak" aunque su entropía diga otra cosa.
 */

const POOL_LOWER = 26;
const POOL_UPPER = 26;
const POOL_DIGIT = 10;
const POOL_SYMBOL = 33;

const WEAK_BITS = 40;
const STRONG_BITS = 60;

const COMMON_PASSWORDS = new Set([
  'password',
  'contraseña',
  'contrasena',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'abc123',
  '111111',
  'iloveyou',
  'clave',
]);

function charClass(char) {
  if (/\d/.test(char)) {
    return 'digit';
  }
  if (/[a-z]/.test(char)) {
    return 'lower';
  }
  if (/[A-Z]/.test(char)) {
    return 'upper';
  }
  return 'symbol';
}

function repeatedRunPenalty(password) {
  let penalty = 0;
  let run = 1;

  for (let i = 1; i <= password.length; i += 1) {
    if (i < password.length && password[i] === password[i - 1]) {
      run += 1;
    } else {
      if (run >= 3) {
        penalty += run - 1;
      }
      run = 1;
    }
  }

  return penalty;
}

function sequenceRunPenalty(password) {
  let penalty = 0;
  let run = 1;
  let direction = 0;

  for (let i = 1; i <= password.length; i += 1) {
    if (i < password.length) {
      const delta = password.charCodeAt(i) - password.charCodeAt(i - 1);
      const sameClass = charClass(password[i - 1]) === charClass(password[i]);
      const isStep = delta === 1 || delta === -1;

      if (sameClass && isStep) {
        if (run === 1) {
          direction = delta;
          run = 2;
        } else if (delta === direction) {
          run += 1;
        } else {
          if (run >= 3) {
            penalty += run - 1;
          }
          direction = delta;
          run = 2;
        }
        continue;
      }
    }

    if (run >= 3) {
      penalty += run - 1;
    }
    run = 1;
    direction = 0;
  }

  return penalty;
}

export function estimatePasswordStrength(value) {
  const password = String(value || '');
  const length = password.length;

  if (!length) {
    return { bits: 0, classes: 0, level: 'none' };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  let pool = 0;
  if (hasLower) {
    pool += POOL_LOWER;
  }
  if (hasUpper) {
    pool += POOL_UPPER;
  }
  if (hasDigit) {
    pool += POOL_DIGIT;
  }
  if (hasSymbol) {
    pool += POOL_SYMBOL;
  }

  const classes = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  const effectiveLength = Math.max(
    length - repeatedRunPenalty(password) - sequenceRunPenalty(password),
    1,
  );
  const bits = effectiveLength * Math.log2(Math.max(pool, 2));

  let level;
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    level = 'weak';
  } else if (length < 8 || bits < WEAK_BITS) {
    level = 'weak';
  } else if (bits < STRONG_BITS) {
    level = 'medium';
  } else {
    level = 'strong';
  }

  return { bits, classes, level };
}
