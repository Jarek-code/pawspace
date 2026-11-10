/*
 * Protege la pantalla posterior al login.
 * Si no hay token guardado, regresa al formulario de acceso.
 */

import { haySesion } from "/services/auth.js";

if (!haySesion()) {
  window.location.replace("/");
}
