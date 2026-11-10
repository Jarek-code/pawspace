# API

Base: `http://localhost:8000`. La documentación interactiva la genera FastAPI en `/docs`.

## Rutas

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/` | Mensaje de bienvenida |
| GET | `/health` | Estado del servicio |
| GET | `/Usuarios` | Lista de cuentas, sin credenciales |
| POST | `/api/usuarios/registro` | Crea una cuenta |
| POST | `/api/usuarios/login` | Comprueba credenciales y abre sesión |
| GET | `/api/usuarios/{id}/actividad` | Cuenta de MariaDB con su actividad de MongoDB |
| PATCH | `/api/usuarios/{id}/estado` | Activa o desactiva la cuenta en las dos fuentes |
| GET | `/adjuntos/salud` | Estado de la base de objetos |
| GET | `/adjuntos/archivo/{nombre}` | Entrega un archivo guardado |
| POST | `/adjuntos/{tabla}/{id}` | Ancla un contenido a su fila |
| POST | `/adjuntos/{tabla}/{id}/archivos` | Cuelga un adjunto por URL |
| POST | `/adjuntos/{tabla}/{id}/subir` | Sube un archivo y lo cuelga |
| GET | `/adjuntos/{tabla}/{id}` | Lista los adjuntos de una fila |
| DELETE | `/adjuntos/{tabla}/{id}` | Borra el contenido y sus adjuntos |

## Registro

```bash
curl -X POST http://localhost:8000/api/usuarios/registro \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Sofia Ramirez","email":"sofia.ramirez@example.com","contrasena":"Pawspace2026"}'
```

```json
{"mensaje": "Usuario creado con exito"}
```

La escritura pasa por un procedimiento que llena la tabla de cuentas y la de credenciales. El correo
es único y la contraseña se guarda cifrada.

<details>
<summary>Errores del registro</summary>

| Situación | Código | Respuesta |
|---|---|---|
| Datos incompletos o mal formados | 422 | Lista de campos con el problema |
| Correo repetido | 400 | Mensaje con el detalle de la base |
</details>

## Inicio de sesión

```bash
curl -X POST http://localhost:8000/api/usuarios/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"sofia.ramirez@example.com","contrasena":"Pawspace2026"}'
```

```json
{
  "token_acceso": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_tipo": "bearer",
  "sesion_id": "ses_001a1bf0ec0c3841c5fb991d6"
}
```

| Situación | Código | Detalle |
|---|---|---|
| Credenciales correctas | 200 | Token y sesión |
| Correo desconocido o contraseña incorrecta | 401 | `Correo o contrasena incorrecta` |
| Cuenta desactivada | 403 | `Esta cuenta ha sido desactivada.` |

La lectura sale de MariaDB. El acceso correcto abre un documento en `sesiones` y escribe un evento en
`eventos`; el intento rechazado solo escribe el evento, con el motivo y un hash del identificador.

## Actividad de una cuenta

```bash
curl http://localhost:8000/api/usuarios/5/actividad
```

```json
{
  "usuario": {"id": 5, "nombre": "Sofia Ramirez", "email": "sofia.ramirez@example.com", "activo": true},
  "actividad": {"sesiones": 4, "accesos_correctos": 4, "intentos_fallidos": 3},
  "fuentes": {"relacional": "ok", "logs": "ok"},
  "degradado": false,
  "aviso": null
}
```

El bloque `usuario` viene de MariaDB y el bloque `actividad` de MongoDB. Cuando la segunda fuente no
responde, `actividad` llega en `null`, `degradado` en `true` y el campo `aviso` explica qué falta. No
se devuelven ceros.

## Cambio de estado

```bash
curl -X PATCH http://localhost:8000/api/usuarios/5/estado \
  -H 'Content-Type: application/json' \
  -d '{"activo": false}'
```

```json
{
  "usuario": {"id": 5, "activo": false, "actualizado_en": "2026-11-09T06:47:20"},
  "fuentes": {"relacional": "ok", "logs": "ok"},
  "parcial": false,
  "evento_id": "evt_001a1bf0f024af35597e65e13",
  "aviso": null
}
```

El cambio se guarda en MariaDB y se registra un evento en MongoDB. Si la segunda fuente no responde,
la respuesta llega con `parcial` en `true` y el aviso correspondiente, porque el cambio local ya
quedó guardado.

## Errores

Los errores propios usan `{"detail": "..."}`. Los de validación devuelven `{"detail": [...]}` con la
lista de campos.

## Pendiente

Ninguna ruta exige el token todavía. El módulo de verificación existe en `backend/src/middleware` y
no está conectado a las rutas. Tampoco hay cierre de sesión ni recuperación de contraseña.
