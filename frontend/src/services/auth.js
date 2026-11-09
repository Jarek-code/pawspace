/*
 * Servicio de autenticacion.
 * El frontend habla siempre con la API a traves de nginx en el mismo origen.
 * Si se necesita otro destino, se puede definir window.PAWSPACE_API_BASE.
 */

const API_BASE = (window.PAWSPACE_API_BASE || "/api").replace(/\/$/, "");

const CLAVES = {
  token: "pawspace.token",
  tipo: "pawspace.token_tipo",
  sesion: "pawspace.sesion",
  email: "pawspace.email",
};

/* Error de la API con el codigo HTTP y la respuesta original. */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/* Extrae un mensaje legible del detalle de FastAPI. */
function mensajeDeError(data, status) {
  if (data && typeof data.detail === "string") {
    return data.detail;
  }

  if (data && Array.isArray(data.detail) && data.detail.length > 0) {
    const primero = data.detail[0];
    if (primero && typeof primero.msg === "string") {
      return primero.msg;
    }
  }

  if (status === 401) {
    return "Correo o contraseña incorrecta.";
  }

  if (status === 403) {
    return "Esta cuenta ha sido desactivada.";
  }

  return "No pudimos completar la solicitud.";
}

/*
 * Envia las credenciales al endpoint de login.
 * Devuelve { token_acceso, token_tipo, sesion_id }.
 */
export async function iniciarSesion(email, contrasena) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 15000);

  let respuesta;

  try {
    respuesta = await fetch(`${API_BASE}/usuarios/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        contrasena,
      }),
      credentials: "same-origin",
      signal: controlador.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError("La solicitud tardó demasiado. Intenta de nuevo.", 0, null);
    }
    throw new ApiError("No pudimos conectar con el servidor.", 0, null);
  } finally {
    clearTimeout(temporizador);
  }

  let datos = null;

  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    throw new ApiError(mensajeDeError(datos, respuesta.status), respuesta.status, datos);
  }

  return datos;
}

/*
 * Guarda el token. Si la persona marco "Mantener sesion iniciada" se usa
 * localStorage; si no, sessionStorage. Siempre se limpia el almacenamiento
 * contrario para no reutilizar una sesion vieja.
 */
export function guardarSesion(datos, mantenerSesion) {
  const destino = mantenerSesion ? localStorage : sessionStorage;
  const otro = mantenerSesion ? sessionStorage : localStorage;

  otro.removeItem(CLAVES.token);
  otro.removeItem(CLAVES.tipo);
  otro.removeItem(CLAVES.sesion);
  otro.removeItem(CLAVES.email);

  destino.setItem(CLAVES.token, datos.token_acceso || "");
  destino.setItem(CLAVES.tipo, datos.token_tipo || "bearer");
  destino.setItem(CLAVES.sesion, datos.sesion_id || "");
  destino.setItem(CLAVES.email, datos.email || "");
}

/* Indica si existe un token guardado. */
export function haySesion() {
  return Boolean(
    localStorage.getItem(CLAVES.token) || sessionStorage.getItem(CLAVES.token)
  );
}

/* Borra cualquier token guardado. */
export function cerrarSesion() {
  for (const almacen of [localStorage, sessionStorage]) {
    almacen.removeItem(CLAVES.token);
    almacen.removeItem(CLAVES.tipo);
    almacen.removeItem(CLAVES.sesion);
    almacen.removeItem(CLAVES.email);
  }
}
