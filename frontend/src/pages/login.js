/*
 * Logica de la pantalla de login D01 / D01b.
 * Valida el correo en el cliente, avisa de Bloq Mayus y llama a la API.
 * Las demas opciones de autenticacion quedan fuera de esta prueba.
 */

import { ApiError, guardarSesion, iniciarSesion } from "/services/auth.js";

/* Terminaciones aceptadas por la revision del correo. */
const TLDS_PERMITIDOS = new Set([
  "com",
  "mx",
  "org",
  "net",
  "edu",
  "gob",
  "io",
  "dev",
]);

const CORREO_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

const formulario = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailField = document.getElementById("email-field");
const passwordField = document.getElementById("password-field");
const emailMessage = document.getElementById("email-message");
const passwordMessage = document.getElementById("password-message");
const passwordToggle = document.getElementById("password-toggle");
const passwordWarning = document.getElementById("password-warning");
const rememberInput = document.getElementById("remember");
const submitButton = document.getElementById("login-submit");
const submitLabel = document.getElementById("login-submit-label");
const authAlert = document.getElementById("auth-alert");
const authAlertTitle = document.getElementById("auth-alert-title");
const authAlertBody = document.getElementById("auth-alert-body");

/* Revisa estructura basica y que la terminacion este en la lista permitida. */
function correoValido(valor) {
  const correo = valor.trim();

  if (!CORREO_RE.test(correo)) {
    return false;
  }

  const partes = correo.split("@");

  if (partes.length !== 2) {
    return false;
  }

  const [local, dominio] = partes;

  if (
    !local ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    dominio.startsWith(".") ||
    dominio.endsWith(".") ||
    dominio.includes("..")
  ) {
    return false;
  }

  const tld = dominio.slice(dominio.lastIndexOf(".") + 1).toLowerCase();

  return TLDS_PERMITIDOS.has(tld);
}

/* Muestra el aviso general de error. */
function mostrarAlerta(titulo, cuerpo) {
  authAlert.hidden = false;
  authAlertTitle.textContent = titulo;
  authAlertBody.textContent = cuerpo;
}

/* Oculta y limpia el aviso general. */
function ocultarAlerta() {
  authAlert.hidden = true;
  authAlertTitle.textContent = "";
  authAlertBody.textContent = "";
}

/* Marca un campo con error y, si hay texto, lo muestra debajo. */
function marcarCampoConError(campo, mensaje) {
  const input = campo.querySelector(".field__input");
  const salida = campo.querySelector(".field__message");

  campo.classList.add("is-invalid");
  input.setAttribute("aria-invalid", "true");

  if (salida) {
    salida.textContent = mensaje || "";
  }
}

/* Limpia el estado de error de un campo. */
function limpiarCampo(campo) {
  const input = campo.querySelector(".field__input");
  const salida = campo.querySelector(".field__message");

  campo.classList.remove("is-invalid");
  input.removeAttribute("aria-invalid");

  if (salida) {
    salida.textContent = "";
  }
}

/* Activa o desactiva el estado de carga del boton. */
function ponerCargando(activo) {
  submitButton.disabled = activo;
  submitButton.classList.toggle("is-loading", activo);
  submitButton.setAttribute("aria-busy", String(activo));
  submitLabel.textContent = activo ? "Entrando..." : "Entrar";
}

/* Lleva el foco al aviso general para lectores de pantalla. */
function enfocarAlerta() {
  authAlert.setAttribute("tabindex", "-1");
  authAlert.focus({ preventScroll: false });
}

/* Detecta Bloq Mayus en los eventos del teclado. */
function revisarBloqMayus(evento) {
  if (typeof evento.getModifierState !== "function") {
    return;
  }

  passwordWarning.hidden = !evento.getModifierState("CapsLock");
}

/* Muestra u oculta la contrasena sin perder el foco. */
function alternarContrasena() {
  const visible = passwordInput.type === "text";

  passwordInput.type = visible ? "password" : "text";
  passwordToggle.textContent = visible ? "Mostrar" : "Ocultar";
  passwordToggle.setAttribute("aria-pressed", String(!visible));
  passwordToggle.setAttribute(
    "aria-label",
    visible ? "Mostrar contraseña" : "Ocultar contraseña"
  );

  passwordInput.focus({ preventScroll: true });
  const longitud = passwordInput.value.length;
  passwordInput.setSelectionRange(longitud, longitud);
}

/* Traduce el error de la API a la pantalla D01b. */
function presentarError(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      marcarCampoConError(emailField, "");
      mostrarAlerta(
        "No pudimos entrar",
        "El correo o la contraseña no son correctos."
      );
      emailInput.focus();
      return;
    }

    if (error.status === 403) {
      mostrarAlerta("Cuenta desactivada", "Esta cuenta ha sido desactivada.");
      enfocarAlerta();
      return;
    }

    if (error.status === 422) {
      marcarCampoConError(emailField, "Revisa el formato del correo.");
      mostrarAlerta("Revisa los datos", "El correo no tiene un formato válido.");
      emailInput.focus();
      return;
    }

    if (error.status === 0) {
      mostrarAlerta(
        "No pudimos conectar",
        "Revisa que la API esté en marcha e intenta de nuevo."
      );
      enfocarAlerta();
      return;
    }

    mostrarAlerta(
      "No pudimos entrar",
      "Ocurrió un error en el servidor. Intenta de nuevo."
    );
    enfocarAlerta();
    return;
  }

  mostrarAlerta(
    "No pudimos entrar",
    "Ocurrió un error inesperado. Intenta de nuevo."
  );
  enfocarAlerta();
}

/* Envio del formulario. */
async function enviarFormulario(evento) {
  evento.preventDefault();

  ocultarAlerta();
  limpiarCampo(emailField);
  limpiarCampo(passwordField);

  let primerCampoInvalido = null;

  if (!emailInput.value.trim()) {
    marcarCampoConError(emailField, "Escribe tu correo electrónico.");
    primerCampoInvalido = emailInput;
  } else if (!correoValido(emailInput.value)) {
    marcarCampoConError(
      emailField,
      "Ingresa un correo válido con terminación .com, .mx u .org."
    );
    primerCampoInvalido = emailInput;
  }

  if (!passwordInput.value) {
    marcarCampoConError(passwordField, "Escribe tu contraseña.");
    primerCampoInvalido = primerCampoInvalido || passwordInput;
  }

  if (primerCampoInvalido) {
    primerCampoInvalido.focus();
    return;
  }

  ponerCargando(true);

  try {
    const datos = await iniciarSesion(emailInput.value, passwordInput.value);

    if (!datos || !datos.token_acceso) {
      mostrarAlerta(
        "No pudimos entrar",
        "La respuesta del servidor no incluyó un token de acceso."
      );
      enfocarAlerta();
      return;
    }

    guardarSesion(
      { ...datos, email: emailInput.value.trim() },
      rememberInput.checked
    );

    window.location.assign("/proximamente/");
  } catch (error) {
    presentarError(error);
  } finally {
    ponerCargando(false);
  }
}

/* Al corregir un campo se limpia su error y el aviso general. */
emailInput.addEventListener("input", () => {
  limpiarCampo(emailField);
  ocultarAlerta();
});

passwordInput.addEventListener("input", () => {
  limpiarCampo(passwordField);
  ocultarAlerta();
});

passwordInput.addEventListener("keydown", revisarBloqMayus);
passwordInput.addEventListener("keyup", revisarBloqMayus);
passwordInput.addEventListener("blur", () => {
  passwordWarning.hidden = true;
});

passwordToggle.addEventListener("click", alternarContrasena);
formulario.addEventListener("submit", enviarFormulario);
