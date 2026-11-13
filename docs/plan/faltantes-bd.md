# Plan — funcionalidades de las pantallas D16–D33 / M09–M26

Qué falta para que las pantallas de perfil, mensajería, historias, configuración, moderación y
ayuda funcionen sobre las tres fuentes (MariaDB distribuida, OODB en Rust y MongoDB). El documento
dice, por funcionalidad, si se resuelve **solo en el backend** o si hay que tocar tablas, clases o
documentos, y deja preparado el paquete de migraciones.

Rama: `plan/funcionalidades-faltantes`. Los códigos de pantalla salen de la rama `ui-ux`
(`origin/ui-ux`, commit `d7ebed9`): `D##` escritorio, `M##` móvil, `CMP-##` componente. Esa rama
todavía no está en `main`, así que aquí se citan por su identificador.

---

## 1. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Sesiones activas / cerrar todas / expirada | **Híbrido**: Mongo decide la validez del token (con caché corta), MariaDB guarda el resumen para listar y cerrar en masa |
| Historias vencidas | **La fila `HISTORIA` no se borra**: vive en archivo y destacadas y el medio se conserva en la OODB |
| Recibos de lectura | **Los dos**: puntero `leído hasta` en el participante + tabla de lecturas por mensaje |
| Ubicación de mascota | Ciudad y país como texto **+ lat/lng opcionales** para «cerca de mí» |
| Privacidad y preferencias | **Todo por mascota**: una tabla `MASCOTA_PREFERENCIAS` |
| Soporte | **Tablas propias en MariaDB** con hilo, y la captura anclada en la OODB |
| Reintentar envío fallido | Estado en el cliente + `clave_cliente` en `MENSAJE` para idempotencia |
| Descargar mis datos | Backend + colección Mongo `exportaciones` |
| Verificación de correo | **No hay**: sin `email_verificado_en` y sin distintivo «Verificado» en el correo; el correo sólo se valida por formato |
| Baja de cuenta | La cuenta se marca y sus mascotas **quedan inactivas con borrado lógico**; no se borra ninguna fila de `MASCOTA` |
| Búsqueda del centro de ayuda | Se consulta **`dn_a` directamente** con un usuario de sólo lectura: el `FULLTEXT` no existe a través del envoltorio de Spider |
| Avisos (correo, push, tipos) | **Por cuenta** (`USUARIO_PREFERENCIAS`); privacidad y filtros siguen **por mascota** |
| Purgas de 30 y 90 días | **Híbrido**: `EVENT` en `dn_a` marca, y una llamada programada empuja `/revisar` de la OODB |
| Paquete de migraciones | **Agrupadas por fuente** (MariaDB, distribución/Spider, Mongo, Rust), ALTER sobre BD viva y `schema.sql` actualizado en paralelo |

---

## 2. Reglas del terreno (lo que hay que respetar al tocar cualquier cosa)

Estas cinco reglas explican por qué un cambio de una columna no es un cambio de una línea.

1. **`database/schema.sql` es la fuente; `database/distribuida/**` se genera.** Todo lo de
   `database/distribuida` lo escribe `devops/scripts/generar_sql.py` y lleva la cabecera «no editar
   a mano». Tras cualquier cambio hay que correr `./devops/scripts/generar_sql.py` y revisar el
   `git diff`.
2. **El generador tiene cuatro listas de configuración** que hay que tocar a mano:
   `FRAGMENTADAS` (paridad del dueño), `CORTES` (satélites verticales), `PROCEDIMIENTOS_H`
   (procedimientos de las tablas fragmentadas) y los datos de ejemplo (`ESPECIES`… `FRAGMENTO_FILAS`,
   `datos_dn_a()`, `datos_dn_b()`, y el diccionario `ajeno` de `bloque_fragmento`).
3. **El esquema no se parsea con tolerancia.** `leer_esquema` reconoce sólo `CREATE TABLE <nombre> (`
   en una línea y cierra con `) ENGINE=` en la columna 0. Un `CREATE TABLE IF NOT EXISTS`, un
   comentario al final de la cabecera o un cuerpo sin la indentación de 4 espacios dejan la tabla
   fuera de la distribución sin avisar (el generador no falla, simplemente no la ve).
4. **Lo no fragmentado vive en `dn_a` y se replica** a `dn_b`, `rep_a` y `rep_b`. En el nodo Spider
   esas tablas son envoltorios (`ENGINE=SPIDER`) que llevan **sólo columnas y clave primaria**: sin
   índices, sin FK y sin `FULLTEXT`. Consecuencia práctica: un `FULLTEXT` que se declare en
   `schema.sql` existe en `dn_a` pero no a través de Spider, así que `MATCH … AGAINST` sólo funciona
   consultando `dn_a` directamente (nivel 5 de la arquitectura, «esquema externo»); por el envoltorio
   hay que usar `LIKE` o resolver la búsqueda en el backend.
5. **Cada corte vertical genera un `sp_<tabla>_crear`** con las columnas del satélite en la firma.
   Añadir columnas a `CORTES` cambia la firma del procedimiento y obliga a tocar la llamada del
   backend (`CALL sp_usuario_crear(...)` en `backend/src/services/check_this.py`). Además,
   `filas_vertical` sólo emite clave, columnas, `PRIMARY KEY` y FK: **los satélites no llevan
   índices**; si un dato movido a un satélite necesita índice, hay que ampliar esa función.

Notas de las otras dos fuentes:

- **OODB (Rust)**: el motor (`oodb/crates/oodb`) es genérico y no conoce tablas. Lo que sabe de
  MariaDB está en `pawspace-modelo` (`ancla.rs`, `contenido.rs`) y en `pawspace-servicio`
  (`mariadb.rs`, `puerto.rs`, `revision.rs`). Una clase nueva **no necesita migración de datos**; el
  formato versionado (`FORMATO` + `Migrador`) sólo se toca si cambia la forma de un registro ya
  guardado.
- **MongoDB**: los validadores se crean una vez (primer arranque). Cualquier cambio de validador o de
  índice exige `collMod` / `createIndex` en la migración, y `collMod` **reemplaza el validador
  completo**, así que hay que repetirlo entero. El vocabulario de acciones vive duplicado en
  `logs/pawspace_logs/modelo.py` y en `database/mongo/initdb/01-colecciones.js`: los dos cambian
  juntos.

---

## 3. Resumen

| # | Funcionalidad | Veredicto | Objetos nuevos o tocados | Coste |
|---|---|---|---|---|
| 1 | Sesiones activas / cerrar todas / expirada (D28, M21, D12) | MariaDB + Mongo | tabla `SESION`; colección `sesiones` (campos e índice) | medio |
| 2 | Portada de perfil (D16, D18) | 1 columna | `MASCOTA_PERFIL.foto_portada_url` | bajo |
| 3 | Ubicación de mascota (D17, D23, D27) | 4 columnas | `MASCOTA_PERFIL` (ciudad, país, lat, lng) | bajo |
| 4 | Respuestas a historias (D19, M12) | 1 columna | `MENSAJE.historia_id` | bajo |
| 5 | Historias destacadas (D21) | 2 tablas + regla del reconciliador | `HISTORIA_DESTACADA`, `HISTORIA_DESTACADA_ELEMENTO`; Rust | medio |
| 6 | Adjuntos en mensajes (D27, M20, CMP-52) | Rust + 0 tablas | `Tabla::Mensaje`, clase `Mensaje` | medio |
| 7 | Recibos de lectura (CMP-52) | tabla + 2 columnas | `MENSAJE_LECTURA` (fragmentada por mascota), `CONVERSACION_PARTICIPANTE` | medio |
| 8 | Silenciar conversación (D27) | 2 columnas | `CONVERSACION_PARTICIPANTE` | bajo |
| 9 | Reintentar envío fallido (CMP-52) | 1 columna | `MENSAJE.clave_cliente` | bajo |
| 10 | Teléfono, ubicación y biografía del tutor (D28, M21) | satélite nuevo | `USUARIO_PERFIL` + `CORTES` + `sp_usuario_crear` | medio |
| 11 | Filtros de contenido (D30, M23) | 2 tablas nuevas | `MASCOTA_PREFERENCIAS` + `USUARIO_PREFERENCIAS` | bajo |
| 12 | Apelar un reporte (D30) | 1 tabla + 3 columnas | `REPORTE_APELACION`, `REPORTE` | bajo |
| 13 | Solicitudes de soporte (D33, M26) | 2 tablas + Rust | `TICKET_SOPORTE`, `TICKET_MENSAJE`, `Tabla::TicketSoporte` | medio |
| 14 | Centro de ayuda (D31, D32) | 3 tablas | `AYUDA_CATEGORIA`, `AYUDA_ARTICULO`, `AYUDA_ARTICULO_UTIL` | medio |
| 15 | Descargar mis datos (D29) | Mongo + backend | colección `exportaciones`, acción `datos.exportar` | bajo |

Siete funcionalidades **no necesitan tablas nuevas** (2, 3, 4, 8, 9, 12 parcialmente y 15); dos
necesitan cambios en Rust (5 y 6) y una toca el procedimiento de registro (10).

---

## 4. Detalle por funcionalidad

### 1. Sesiones activas, cerrar todas y sesión expirada — D28, M21, D12

**Pantalla** (D28, riel «Sesiones activas»): `MacBook Pro · Madrid · ahora`,
`iPhone 15 · Madrid · hace 2 h`, botón **Cerrar** por sesión, **Cerrar todas las sesiones** y
**Cerrar sesión en todos los dispositivos**. La regla del flujo añade: cambiar la contraseña cierra
las demás sesiones, y «sesión desconocida» se resalta para ofrecer cerrar todas.

**Hoy**: la sesión es sólo un documento de `sesiones` en Mongo, sin caducidad propia (el TTL es de
400 días) y sin datos de dispositivo ni ubicación. No existe forma de expirar ni de cerrar en masa.
La API no valida el token en ninguna ruta (`docs/api.md`: «Ninguna ruta exige el token todavía»).

**Veredicto**: Mongo decide (es donde el login ya escribe) y MariaDB guarda el resumen que la
pantalla lista y cierra. La caché es obligatoria: la dependencia de autenticación no puede consultar
Mongo en cada petición con la misma latencia que hoy.

*MariaDB — tabla nueva (replicada, no fragmentada):*

```sql
CREATE TABLE SESION (
    id VARCHAR(64) NOT NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NULL,
    dispositivo VARCHAR(120) NULL,
    plataforma VARCHAR(60) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    iniciada_en DATETIME NOT NULL,
    ultima_actividad_en DATETIME NOT NULL,
    expira_en DATETIME NOT NULL,
    cerrada_en DATETIME NULL,
    cerrada_por ENUM('USUARIO', 'TODAS', 'CONTRASENA', 'EXPIRADA', 'CUENTA_ELIMINADA') NULL,
    CONSTRAINT pk_sesion PRIMARY KEY (id),
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIO(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_sesion_mascota FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_sesion_usuario_abierta (usuario_id, cerrada_en),
    INDEX idx_sesion_mascota_abierta (mascota_id, cerrada_en),
    INDEX idx_sesion_expira (expira_en),
    INDEX idx_sesion_ultima_actividad (ultima_actividad_en)
) ENGINE=InnoDB;
```

El `id` es el `_id` (`ses_…`) del documento de Mongo: es lo que enlaza las dos fuentes sin duplicar
identidad. `cerrada_por` es `ENUM` y no `TEXT` porque la pantalla y los informes lo agrupan.

*Mongo — colección `sesiones`*: `expira_en` (obligatorio, base de la caducidad),
`dispositivo {nombre, plataforma}`, `ubicacion {ciudad, pais}` y `cerrada_por` (espejo del `ENUM`).
Índice nuevo `por_actor_abiertas` sobre `{actor.id: 1, cerrada_en: 1, ultima_actividad_en: -1}`
para «¿sigue abierta esta sesión?» y para listar sin escanear. El TTL de 400 días se mantiene: tiene
que ser mayor que cualquier `expira_en` razonable.

*Vocabulario*: `sesion.cerrar_todas` y `sesion.expirar` en `modelo.py` y en `01-colecciones.js`.

*Backend*: dependencia de autenticación con caché en proceso (p. ej. 5–15 s) que consulta
`sesiones` por `_id` y responde 401 con motivo `sesion_expirada` / `sesion_cerrada`; rutas
`GET /api/sesiones`, `DELETE /api/sesiones/{id}`, `DELETE /api/sesiones` (todas menos la actual).
`cerrar_sesion()` ya existe en `logs/pawspace_logs/cliente.py`; falta el cierre masivo.

**Riesgo**: con Mongo caído nadie entra. Mitigación: la caché sobrevive al corte y, si nunca hubo
respuesta, se permite el paso con `degradado=true` (mismo patrón que `/actividad`) y se registra el
aviso.

---

### 2. Portada de perfil — D16, D18

**Pantalla**: bloque «Foto de portada» con **Cambiar**, y el caso límite «sin portada → bloque
neutro». El avatar ya está cubierto por `MASCOTA_PERFIL.foto_perfil_url`.

**Veredicto**: una columna. El archivo no necesita clase nueva en la OODB: se sube con
`POST /archivos` (ya existe) y se guarda la URL devuelta, igual que se hará con el avatar.

```sql
-- dentro de MASCOTA_PERFIL
foto_portada_url VARCHAR(2048) NULL,
```

*Rust*: sin cambios (la portada no es contenido anclable; no tiene adjuntos ni ciclo de vida).
*Backend*: `PATCH /api/mascotas/{id}/perfil` con `foto_portada_url`; validar que la URL venga del
servicio de archivos (`publica`) y no de fuera.

---

### 3. Ubicación de mascota — D17, D23, D27, M17

**Pantallas**: D18 muestra `Ubicación · Madrid, España`; D23 filtra por `Ubicación · Cerca de mí ·
50 km`; D27 enseña `Madrid · A 2 km`; D29 tiene el interruptor **Mostrar ubicación** (que sólo
enseña la ciudad).

**Veredicto**: cuatro columnas en el satélite de perfil, más el interruptor en `MASCOTA_PREFERENCIAS`
(§4.11). Las coordenadas son opcionales: sin ellas el perfil funciona, sólo se pierde la distancia.

```sql
-- dentro de MASCOTA_PERFIL
ubicacion_ciudad VARCHAR(100) NULL,
ubicacion_pais VARCHAR(100) NULL,
latitud DECIMAL(9, 6) NULL,
longitud DECIMAL(9, 6) NULL
```

**Atención, límite del generador**: `filas_vertical` construye el satélite sólo con la clave, las
columnas, la `PRIMARY KEY` y la FK; **no emite índices**. Un `INDEX (latitud, longitud)` dentro del
satélite no sobrevive a la generación: si se quiere, hay que ampliar `filas_vertical` con una lista
opcional de índices por corte (cambio pequeño y contenido, en un solo sitio). Si no se amplía, la
caja de búsqueda por lat/lng se resuelve con un recorrido sobre `vMASCOTA` y el catálogo de mascotas
sigue siendo pequeño.

**Por qué en el satélite y no en `MASCOTA`**: la columna no se filtra en el feed ni se ordena; es
dato de perfil, exactamente el motivo del corte vertical ya declarado en `CORTES`.

**Consulta de «cerca de mí»**: caja de búsqueda por `latitud`/`longitud` y afinado con la fórmula
del semiverseno en SQL (`6371 * ACOS(...)`) — MariaDB no permite índice espacial sobre `DECIMAL`, y
crear una columna `POINT` obligaría a que el envoltorio de Spider la expusiera. Con la caja de
lat/lng el índice sirve y la precisión alcanza para «50 km».

**Privacidad**: `mostrar_ubicacion = 0` ⇒ el backend devuelve `NULL` en `ubicacion_ciudad`/`pais` y
en `latitud`/`longitud` para cualquier lector que no sea la propia mascota. La distancia de D27 sólo
se calcula si la otra mascota comparte ubicación; si no, se omite el bloque.

*Backend*: sin cambios de esquema en `PUBLICACION` ni en `MASCOTA`.

---

### 4. Respuestas a historias — D19, M12

**Pantallas**: D19 tiene barra `Responder a Luna…` y el flujo dice «Responder abre el mensaje
directo con el contexto de la historia». Hoy no hay forma de saber a qué historia responde un
mensaje.

**Veredicto**: una columna en `MENSAJE` (no una tabla nueva). La respuesta **es** un mensaje directo:
duplicarla en una tabla aparte obligaría a mantener dos hilos y a decidir cuál es la verdad.

```sql
-- dentro de MENSAJE
historia_id BIGINT UNSIGNED NULL,
CONSTRAINT fk_mensaje_historia FOREIGN KEY (historia_id) REFERENCES HISTORIA(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
INDEX idx_mensaje_historia (historia_id)
```

**Reglas**: la respuesta crea o reutiliza la conversación entre las dos mascotas; `texto` sigue
siendo obligatorio en el compositor. En el hilo, la burbuja con `historia_id` muestra la miniatura y
el enlace al visor, y `NULL` es un mensaje normal.

**Aviso**: la historia vence a las 24 h pero la fila ya no se borra (§4.5), así que la miniatura sigue
resolviendo. Con el diseño anterior (borrado al vencer) la respuesta habría quedado huérfana; ese es
el motivo de que estas dos funcionalidades vayan en la misma fase.

*Vocabulario*: no hace falta acción nueva; la respuesta se registra como `publicacion.crear`… no
aplica: ver el hueco de mensajería en la tabla de §5 (no hay acciones de mensaje en el catálogo).

---

### 5. Historias destacadas — D21

**Pantalla**: D21 «Archivo · Últimos 30 días», `Historias activas · Se eliminan en 24 h`, resumen
`3 activas / 12 archivadas / 248 visualizaciones` y el bloque **Historias destacadas**: «Fija tus
mejores historias en el perfil para que no desaparezcan · Crear destacada».

**Veredicto**: dos tablas y un cambio de regla en el reconciliador de la OODB. El listado de activas
y archivo **no necesita tablas**: sale de `HISTORIA` + `HISTORIA_VISTA` + `ME_GUSTA_HISTORIA` con
`vence_en` y `creado_en`. Lo que no existe es el destacado ni la forma de sobrevivir al vencimiento.

*MariaDB — columnas y tablas:*

```sql
-- dentro de HISTORIA
texto VARCHAR(500) NULL,                        -- epígrafe de D19/D20 (hoy no cabe en ninguna parte)
audiencia ENUM('PUBLICO', 'SEGUIDORES', 'SOLO_YO') NOT NULL DEFAULT 'PUBLICO',
permite_respuestas BOOLEAN NOT NULL DEFAULT TRUE,
eliminada_en DATETIME NULL,                     -- borrado explícito del creador
INDEX idx_historia_eliminada (eliminada_en)

CREATE TABLE HISTORIA_DESTACADA (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    mascota_id BIGINT UNSIGNED NOT NULL,
    titulo VARCHAR(60) NOT NULL,
    portada_historia_id BIGINT UNSIGNED NULL,
    orden SMALLINT NOT NULL DEFAULT 0,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_destacada PRIMARY KEY (id),
    CONSTRAINT fk_hd_mascota FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_hd_portada FOREIGN KEY (portada_historia_id) REFERENCES HISTORIA(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_hd_mascota_orden (mascota_id, orden)
) ENGINE=InnoDB;

CREATE TABLE HISTORIA_DESTACADA_ELEMENTO (
    destacada_id BIGINT UNSIGNED NOT NULL,
    historia_id BIGINT UNSIGNED NOT NULL,
    posicion SMALLINT NOT NULL DEFAULT 0,
    agregada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_historia_destacada_elemento PRIMARY KEY (destacada_id, historia_id),
    CONSTRAINT fk_hde_destacada FOREIGN KEY (destacada_id) REFERENCES HISTORIA_DESTACADA(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_hde_historia FOREIGN KEY (historia_id) REFERENCES HISTORIA(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_hde_historia (historia_id)
) ENGINE=InnoDB;
```

**El borrado deja de ser automático.** Hoy `pawspace-servicio` considera fuera de vigencia una
historia vencida (`puerto.rs`: `fuera_de_vigencia = eliminada || vencida`) y borra su objeto de la
OODB. Con destacadas y archivo eso destruiría el medio. El cambio:

| Archivo | Cambio |
|---|---|
| `oodb/crates/pawspace-servicio/src/mariadb.rs` | `consulta(Tabla::Historia)` pasa a `SELECT id, (eliminada_en IS NOT NULL) + 0, 0 …`: la antigüedad ya no cuenta |
| `oodb/crates/pawspace-servicio/src/puerto.rs` | `vencida` deja de alimentarse para `HISTORIA` (se conserva el campo, documentado) |
| barrido nuevo (fuera de la OODB) | marca `eliminada_en` en historias de más de 30 días **que no estén en ningún destacado**; entonces sí se libera el objeto y sus adjuntos |

**Quién marca** (decidido: híbrido). El planificador de eventos está **apagado** hoy
(`SELECT @@event_scheduler` devuelve `OFF` en `dn_a` y en `spider`), así que hay que encenderlo en
`docker-compose.yml` para el nodo maestro y crear el evento **sólo en `dn_a`**: replicado a los demás
nodos se ejecutaría dos veces, y `read_only` no impide que el planificador de una réplica escriba en
su propio nodo.

```sql
-- Sólo en dn_a
CREATE EVENT IF NOT EXISTS ev_historia_archivo
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP + INTERVAL 1 HOUR
DO
    UPDATE HISTORIA h
       SET h.eliminada_en = NOW()
     WHERE h.eliminada_en IS NULL
       AND h.vence_en < NOW() - INTERVAL 30 DAY
       AND NOT EXISTS (SELECT 1 FROM HISTORIA_DESTACADA_ELEMENTO e
                        WHERE e.historia_id = h.id);
```

Y la otra mitad, que la base no puede hacer: un trabajo programado (bucle de la API o script de
`devops/scripts`) llama a `POST /revisar` de la OODB para que el reconciliador libere el objeto y sus
adjuntos. El orden es siempre el mismo: **primero se marca, después el reconciliador borra**, nunca al
revés. El desfase entre las dos mitades es aceptable y hay que documentarlo: un medio puede
sobrevivir hasta la siguiente pasada de `/revisar`.

**Nota de «248 visualizaciones»**: sale de `COUNT(*)` sobre `HISTORIA_VISTA`, que ya existe y ya está
fragmentada. Nada que crear.

---

### 6. Adjuntos en mensajes — D27, M20, CMP-52

**Pantallas**: D27 muestra `Foto · 10:44` dentro del hilo, el riel «Archivos compartidos» con cuatro
miniaturas, y CMP-52 el estado «No se pudo enviar la foto · Reintentar».

**Hoy**: `pawspace-modelo` dice explícitamente que `MENSAJE` no es anclable («`MENSAJE` no tiene
adjuntos en la base, así que no es un contenido anclable»). La OODB, la cola `oodb_pendientes` y el
cliente del backend (`TABLAS = ("PUBLICACION", "HISTORIA", "COMENTARIO")`) limitan el anclaje a tres
tablas.

**Veredicto**: no se toca MariaDB (`MENSAJE.id` ya es fila anclable). Se amplía la OODB.

| Archivo | Cambio |
|---|---|
| `oodb/crates/pawspace-modelo/src/ancla.rs` | variante `Mensaje` en `Tabla`, `TODAS: [Tabla; 4]`, `nombre() → "MENSAJE"`, `admite_video() → true`, texto del error `FromStr` |
| `oodb/crates/pawspace-modelo/src/contenido.rs` | clase `Mensaje` (`#[typetag::serde] impl Objeto`), `exigir_tabla(&ancla, Tabla::Mensaje)`, ramas en `como_contenido` / `como_contenido_mut` |
| `oodb/crates/pawspace-modelo/src/lib.rs` | reexportar `Mensaje` |
| `oodb/crates/pawspace-servicio/src/mariadb.rs` | rama `Tabla::Mensaje => (eliminado_en IS NOT NULL) + 0, 0` |
| `oodb/crates/pawspace-servicio/src/revision.rs` | rama en `contenido_nuevo` |
| `backend/src/services/oodb.py` | `TABLAS = ("PUBLICACION", "HISTORIA", "COMENTARIO", "MENSAJE")` |

`oodb_pendientes.tabla` es `VARCHAR(16)` y `MENSAJE` cabe: la cola no cambia.

**Reglas**: máximo de adjuntos por mensaje más bajo que en una publicación (4 en vez de 10) ⇒
atributo por clase, no la constante global `ADJUNTOS_MAXIMOS`. «Archivos compartidos» de D27 es una
consulta a la OODB por la conversación (`GET /adjuntos` por conversación lo resuelve el backend
recorriendo los `MENSAJE` vivos; si pesa, se añade un índice `conversacion` en la OODB).

---

### 7. Recibos de lectura — CMP-52

**Pantalla**: el «visto» de la burbuja y el contador de no leídos de D26 (`3 sin leer`).

**Veredicto**: tabla por mensaje leído (fragmentada por mascota, igual que `HISTORIA_VISTA`) **y**
puntero en el participante para no escanear la tabla en la bandeja.

```sql
CREATE TABLE MENSAJE_LECTURA (
    mensaje_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    leido_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_mensaje_lectura PRIMARY KEY (mensaje_id, mascota_id),
    CONSTRAINT fk_ml_mensaje FOREIGN KEY (mensaje_id) REFERENCES MENSAJE(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ml_mascota FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_ml_mascota (mascota_id),
    INDEX idx_ml_mensaje_leido (mensaje_id, leido_en)
) ENGINE=InnoDB;
```

`MENSAJE_LECTURA` va a `FRAGMENTADAS` (dueño `mascota_id`): la clave primaria ya contiene el dueño,
que es lo que MariaDB exige en las tablas particionadas por hash. Para que el generador la trate
bien hay que añadirla también a `PROCEDIMIENTOS_H` (con `ON DUPLICATE KEY UPDATE leido_en = NOW()`,
igual que `HISTORIA_VISTA`), a `FRAGMENTO_FILAS` y a la rama de `bloque_fragmento` (su columna ajena
es `mensaje_id`).

```sql
-- dentro de CONVERSACION_PARTICIPANTE
leido_hasta_mensaje_id BIGINT UNSIGNED NULL,
leido_en DATETIME NULL,
```

**Reglas**: marcar leído = insertar en `MENSAJE_LECTURA` los mensajes posteriores al puntero y
actualizar el puntero en la misma transacción. El «visto» azul se muestra cuando el otro participante
tiene `leido_hasta_mensaje_id >= mensaje.id`. El contador de la bandeja sale del puntero más un
`COUNT` acotado por `creado_en`.

---

### 8. Silenciar conversación — D27

**Pantalla**: el riel de D27 tiene **Silenciar**, y el flujo aclara que «silenciar oculta los avisos
de esa conversación, no los mensajes».

**Veredicto**: dos columnas en el participante. Silenciar es una decisión **de cada mascota**, no de
la conversación.

```sql
-- dentro de CONVERSACION_PARTICIPANTE
silenciada_hasta DATETIME NULL,                 -- NULL = no silenciada; 9999 = para siempre
silenciada_en DATETIME NULL,
```

`silenciada_hasta` en vez de un booleano porque D27 ofrece el silencio temporal típico (1 h, 8 h, una
semana). El backend consulta el participante antes de crear una `NOTIFICACION` de tipo `MENSAJE`.

---

### 9. Reintentar envío fallido — CMP-52

**Pantalla**: CMP-52 «No se pudo enviar la foto · Reintentar», y el caso límite «sin conexión el
mensaje queda en cola con estado pendiente».

**Veredicto**: el estado (enviando / fallido / pendiente) es de la interfaz: un fallo de red no llega
al servidor, así que una columna `estado` mentiría. Lo que sí hace falta es **idempotencia**, para
que reintentar no duplique el mensaje.

```sql
-- dentro de MENSAJE
clave_cliente CHAR(36) NULL,
CONSTRAINT uq_mensaje_clave_cliente UNIQUE (conversacion_id, remitente_id, clave_cliente)
```

`UNIQUE` con `NULL` se permite repetido en MariaDB, así que los mensajes que no manden clave (otros
clientes) no chocan. El backend hace `INSERT … ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)` y
devuelve el mensaje existente con 200 en vez de 201.

**Ojo con el envoltorio de Spider**: el `UNIQUE` se declara en `schema.sql`; el envoltorio del nodo
Spider sólo lleva columnas y PK, así que la unicidad la garantiza `dn_a`. Es el mismo criterio que ya
sigue `uq_mgp_publicacion_mascota`.

---

### 10. Teléfono, ubicación y biografía del tutor — D28, M21

**Pantalla** (D28 «Datos personales»): `Nombre`, `Correo electrónico`, `Teléfono`,
`Ubicación (Madrid, España)`, `Biografía (Tutora de Luna…)`, más `Miembro desde`, `Correo ·
Verificado` (que cae, ver más abajo) y `Plan · Gratuito`. El flujo añade que **el perfil público
nunca muestra correo, teléfono ni datos privados del tutor**.

**Veredicto**: satélite vertical nuevo. Son columnas frías, de tamaño variable y con una carga de
privacidad clara; exactamente lo que justifica un corte en este proyecto.

```sql
CREATE TABLE USUARIO_PERFIL (
    usuario_id BIGINT UNSIGNED NOT NULL,
    telefono VARCHAR(32) NULL,
    ubicacion_ciudad VARCHAR(100) NULL,
    ubicacion_pais VARCHAR(100) NULL,
    biografia VARCHAR(500) NULL,
    CONSTRAINT pk_usuario_perfil PRIMARY KEY (usuario_id),
    CONSTRAINT fk_usuario_perfil_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIO(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
```

En `generar_sql.py` se añade el corte:

```python
("USUARIO", "USUARIO_PERFIL", ["telefono", "ubicacion_ciudad", "ubicacion_pais", "biografia"],
 "datos personales del tutor: no viajan en cada listado de cuentas"),
```

y con ello se regeneran solos `03-vertical.sql` (satélite + `vUSUARIO`), `01-esquema-replicado.sql`
(`USUARIO` sin las columnas) y `sp_usuario_crear`. **Un padre con dos satélites necesita una sola
escritura**: el generador emite un procedimiento por padre que inserta en `USUARIO`,
`USUARIO_CREDENCIALES` y `USUARIO_PERFIL` en la misma llamada, y la vista `vUSUARIO` pasa a unir los
dos satélites. Efecto colateral obligatorio: la firma crece con las columnas del perfil y hay que
actualizar `backend/src/services/check_this.py`
(`CALL sp_usuario_crear(:nombre, :email, :hash, :telefono, :ciudad, :pais, :biografia, @nuevo_id)`,
con `NULL` en el registro).

**Columnas que van en la fila caliente de `USUARIO`** (se filtran o las usa el login):

```sql
CREATE TABLE USUARIO (
    …
    plan ENUM('GRATUITO', 'PREMIUM') NOT NULL DEFAULT 'GRATUITO',
    eliminada_en DATETIME NULL,              -- baja de cuenta: borrado lógico (§5.1)
    …
)
```

**Decidido: no hay verificación de correo.** Por eso no se crea `email_verificado_en` ni ninguna
tabla de tokens de verificación: el correo se valida sólo por formato al registrarse y al cambiarlo,
tal como ya dice el flujo de D29. Consecuencia fuera de la base de datos: el distintivo «Correo ·
Verificado» de D28 y la fila «Correo · Verificado» del resumen de cuenta tienen que desaparecer del
wireframe en la rama `ui-ux`; si se quedan, prometen un estado que el sistema nunca va a tener.

---

### 11. Filtros de contenido — D30, M23

**Pantalla** (D30 «Filtros de contenido»): `Ocultar comentarios ofensivos`, `Filtrar palabras clave`
(«oculta publicaciones con palabras que elijas»), `Ocultar cuentas sin foto`.

**Veredicto**: dos tablas, una por alcance. **Decidido: los filtros y la privacidad van por mascota;
los avisos, por cuenta.** Lo que afecta a cómo ven a la mascota se configura en su perfil; lo que
afecta a por dónde llegan los avisos se configura en la cuenta, porque el transporte es uno solo
(D33 muestra un único correo de contacto) y D25 dice que las preferencias «aplican a toda la
cuenta».

```sql
CREATE TABLE MASCOTA_PREFERENCIAS (
    mascota_id BIGINT UNSIGNED NOT NULL,
    mostrar_ubicacion BOOLEAN NOT NULL DEFAULT FALSE,
    permitir_mensajes_desconocidos BOOLEAN NOT NULL DEFAULT FALSE,
    compartir_historias_seguidores BOOLEAN NOT NULL DEFAULT TRUE,
    permitir_descarga_historias BOOLEAN NOT NULL DEFAULT FALSE,
    filtro_comentarios_ofensivos BOOLEAN NOT NULL DEFAULT FALSE,
    filtro_cuentas_sin_foto BOOLEAN NOT NULL DEFAULT FALSE,
    filtro_palabras JSON NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_mascota_preferencias PRIMARY KEY (mascota_id),
    CONSTRAINT fk_mp_mascota FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE USUARIO_PREFERENCIAS (
    usuario_id BIGINT UNSIGNED NOT NULL,
    avisos_correo BOOLEAN NOT NULL DEFAULT TRUE,
    avisos_push BOOLEAN NOT NULL DEFAULT TRUE,
    avisos_tipos JSON NULL,                    -- qué tipos de aviso quiere recibir
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuario_preferencias PRIMARY KEY (usuario_id),
    CONSTRAINT fk_up_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIO(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
```

`USUARIO_PREFERENCIAS` es tabla propia y no un corte vertical de `USUARIO` porque son columnas
nuevas de otro sujeto (preferencias, no datos personales): al no existir antes, no hay nada que
mover y un corte sólo añadiría ceremonia al generador. Si algún día entra un tercer bloque de
preferencias, se convierte en satélite sin tocar el resto.

Los valores por defecto siguen la regla de D29: «privacidad por defecto: mensajes de desconocidos y
ubicación empiezan desactivados».

**`filtro_palabras` como `JSON`** y no como tabla hija: la lista se aplica al armar el feed y nunca se
cruza con otras tablas; una tabla hija añadiría un `JOIN` por publicación. Si más adelante hay que
buscar «quién filtra tal palabra», se normaliza.

**El filtro se aplica en el backend**, no en SQL: `WHERE` contra un `JSON` acaba en `LIKE` sobre el
texto del feed y no usa índices. La consulta del feed trae la lista y descarta en memoria antes de
paginar… o se filtra en la capa de aplicación tras el `SELECT` paginado, aceptando que una página
pueda llegar corta.

`MASCOTA.es_privada` **se queda** donde está: ya está indexado y participa en las consultas de perfil.

---

### 12. Apelar un reporte — D30

**Pantalla** (D30 «Reportes enviados»): estados `En revisión`, `Resuelto`; el flujo añade «un reporte
se puede apelar sólo si está resuelto o rechazado», «apelación fuera de plazo se deshabilita» y «los
reportes propios se archivan tras 90 días».

**Veredicto**: tabla hija para la apelación (una decisión de moderación con su propio estado) y tres
columnas en `REPORTE`.

```sql
-- dentro de REPORTE
resolucion VARCHAR(1000) NULL,       -- qué se decidió, visible para el reportante
archivado_en DATETIME NULL,          -- a los 90 días deja de listarse
INDEX idx_reporte_reportante_archivado (reportado_por_mascota_id, archivado_en),

CREATE TABLE REPORTE_APELACION (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    reporte_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    motivo VARCHAR(2000) NOT NULL,
    estado ENUM('PENDIENTE', 'ACEPTADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
    resolucion VARCHAR(1000) NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resuelto_en DATETIME NULL,
    CONSTRAINT pk_reporte_apelacion PRIMARY KEY (id),
    CONSTRAINT uq_ra_una_por_reporte UNIQUE (reporte_id),
    CONSTRAINT fk_ra_reporte FOREIGN KEY (reporte_id) REFERENCES REPORTE(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ra_mascota FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_ra_mascota (mascota_id),
    INDEX idx_ra_estado (estado, creado_en)
) ENGINE=InnoDB;
```

`UNIQUE (reporte_id)` deja **una sola apelación por reporte** (coherente con «apelar una decisión»);
si se quisiera apelar la apelación, se quita y se pide `estado = 'PENDIENTE'` en el backend.

El plazo de 30 días **no es una columna**: se calcula contra `resuelto_en`. Guardarlo obligaría a
mantenerlo al día cuando cambie la política.

**Estado del reporte**: el `ENUM` de `REPORTE.estado` **no cambia**. La apelación tiene su propio
estado y la pantalla muestra el del reporte; añadir `APELADO` al `ENUM` mezclaría dos ciclos de vida.

**Reporte duplicado** («se informa que ya existe»): no se puede resolver con `UNIQUE` porque el
objetivo son cinco columnas anulables (`publicacion_id`, `comentario_id`, …). Se comprueba en el
backend con el índice `idx_reporte_reportante` que ya existe.

*Vocabulario*: `reporte.apelar` (categoría `moderacion`, sensible).

---

### 13. Solicitudes de soporte — D33, M26

**Pantalla** (D33): `Tema · Cuenta y acceso`, `Correo de contacto`, `Asunto`, `Descripción`,
`Adjuntar captura (opcional) · PNG o JPG · máximo 5 MB`, casilla de privacidad, **Enviar solicitud**,
número de solicitud (`#1042`), historial con `Abierta` / `Resuelta` y «se pueden reabrir durante 30
días».

**Veredicto**: dos tablas y una tabla anclable nueva en la OODB.

```sql
CREATE TABLE TICKET_SOPORTE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NULL,
    tema ENUM('CUENTA', 'PRIVACIDAD', 'MENSAJES', 'REPORTES', 'HISTORIAS', 'OTRO') NOT NULL,
    correo_contacto VARCHAR(320) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('ABIERTA', 'EN_REVISION', 'ESPERANDO_USUARIO', 'RESUELTA', 'CERRADA')
        NOT NULL DEFAULT 'ABIERTA',
    privacidad_aceptada_en DATETIME NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    cerrada_en DATETIME NULL,
    CONSTRAINT pk_ticket_soporte PRIMARY KEY (id),
    CONSTRAINT fk_ts_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIO(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ts_mascota FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_ts_usuario_creado (usuario_id, creado_en),
    INDEX idx_ts_estado_creado (estado, creado_en)
) ENGINE=InnoDB;

CREATE TABLE TICKET_MENSAJE (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ticket_id BIGINT UNSIGNED NOT NULL,
    autor_tipo ENUM('USUARIO', 'SOPORTE') NOT NULL,
    autor_usuario_id BIGINT UNSIGNED NULL,
    texto TEXT NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ticket_mensaje PRIMARY KEY (id),
    CONSTRAINT fk_tm_ticket FOREIGN KEY (ticket_id) REFERENCES TICKET_SOPORTE(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tm_autor FOREIGN KEY (autor_usuario_id) REFERENCES USUARIO(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_tm_ticket_creado (ticket_id, creado_en)
) ENGINE=InnoDB;
```

`privacidad_aceptada_en` es `NOT NULL` a propósito: es la prueba de consentimiento, y el formulario no
se envía sin la casilla.

**El número de la solicitud** es `id` formateado (`#1042`); no hace falta columna aparte.

**OODB**: `Tabla::TicketSoporte` (`"TICKET_SOPORTE"`, `admite_video() → false`, sólo capturas), con
los mismos cinco sitios de cambio que en §4.6. La captura de 5 MB la valida el servicio de archivos,
que ya tiene tope propio.

**Reabrir a los 30 días**: se calcula contra `cerrada_en`; no se guarda.

*Vocabulario*: categoría nueva `soporte` con `soporte.crear` y `soporte.responder`.

---

### 14. Artículos del centro de ayuda — D31, D32

**Pantallas**: D31 tiene buscador, `Temas populares`, `Explora por categoría` con contadores
(`Cuenta y acceso · 8 artículos`), `Preguntas frecuentes`, `Estado del servicio` y `Guías rápidas`;
D32 tiene breadcrumb, artículo con pasos, `¿Te resultó útil? Sí / No`, `Actualizado hace 2 semanas ·
3 min de lectura` y `Artículos relacionados`.

**Veredicto**: tres tablas de contenido editorial. Son datos de negocio: no van a Mongo.

```sql
CREATE TABLE AYUDA_CATEGORIA (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug VARCHAR(60) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    descripcion VARCHAR(255) NULL,
    orden SMALLINT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT pk_ayuda_categoria PRIMARY KEY (id),
    CONSTRAINT uq_ayuda_categoria_slug UNIQUE (slug)
) ENGINE=InnoDB;

CREATE TABLE AYUDA_ARTICULO (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    categoria_id SMALLINT UNSIGNED NOT NULL,
    slug VARCHAR(120) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    resumen VARCHAR(500) NULL,
    contenido MEDIUMTEXT NOT NULL,
    minutos_lectura SMALLINT NOT NULL DEFAULT 1,
    estado ENUM('BORRADOR', 'PUBLICADO', 'RETIRADO') NOT NULL DEFAULT 'BORRADOR',
    publicado_en DATETIME NULL,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    orden SMALLINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_ayuda_articulo PRIMARY KEY (id),
    CONSTRAINT uq_ayuda_articulo_slug UNIQUE (slug),
    CONSTRAINT fk_aa_categoria FOREIGN KEY (categoria_id) REFERENCES AYUDA_CATEGORIA(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_aa_categoria_estado (categoria_id, estado, orden),
    FULLTEXT idx_aa_busqueda (titulo, resumen, contenido)
) ENGINE=InnoDB;

CREATE TABLE AYUDA_ARTICULO_UTIL (
    articulo_id BIGINT UNSIGNED NOT NULL,
    mascota_id BIGINT UNSIGNED NOT NULL,
    util BOOLEAN NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_ayuda_articulo_util PRIMARY KEY (articulo_id, mascota_id),
    CONSTRAINT fk_aau_articulo FOREIGN KEY (articulo_id) REFERENCES AYUDA_ARTICULO(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_aau_mascota FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
```

La clave primaria compuesta de `AYUDA_ARTICULO_UTIL` ya cumple «feedback ya enviado: no se permite
duplicar».

**El `FULLTEXT` no cruza Spider** (regla 4 de §2): existe en `dn_a` y **no** en el envoltorio. Lo
confirmé en el contenedor: `MATCH … AGAINST` sobre una tabla sin índice responde
`ERROR 1191 «Can't find FULLTEXT index matching the column list»`. La aplicación se conecta al spider
con `pawuser`, así que la búsqueda **fallaría siempre** por esa vía.

**Decidido: se busca contra `dn_a`** (nivel 5 de la arquitectura, esquema externo). Consecuencias
concretas:

- usuario nuevo de sólo lectura, en `database/distribuida/nodo-datos/07-usuario-lectura.sql`:
  `CREATE USER 'pawlector'@'%' … GRANT SELECT ON pawspace.* TO 'pawlector'@'%';`
- una cadena de conexión más en `backend/src/config/config.py` (hoy hay una sola, `DATABASE_URL`)
- la ruta de búsqueda usa `MATCH(titulo, resumen, contenido) AGAINST (? IN BOOLEAN MODE)` y ordena
  por relevancia; el resto de la ayuda (categorías, artículo, feedback) sigue por el spider
- hay que documentarlo en `docs/api.md` y en `docs/esquema/05-esquema-externo`: esa lectura **no**
  pasa por la fragmentación, va directa al nodo maestro

Efecto secundario deseable: si se edita un artículo desde el backend, el `INSERT` va por el spider
(fragmentación y procedimiento) y la lectura de búsqueda va por `dn_a`; el `FULLTEXT` se actualiza
solo porque el dato es el mismo.

**Estado del servicio** (D31): no necesita tablas. El backend ya tiene `/health` y las rutas de las
tres fuentes; se compone una respuesta con MariaDB, Mongo y OODB.

---

### 15. Descargar mis datos — D29

**Pantalla**: `Descargar mis datos` con el caso límite «descarga de datos en curso: estado de
progreso y aviso al terminar».

**Veredicto**: casi todo backend, más una colección en Mongo para el estado. **Ninguna tabla nueva en
MariaDB.**

```js
// Mongo: colección exportaciones
{
  _id: "exp_…",
  actor: { tipo: "USUARIO", id: 12, cuenta_id: 12 },
  estado: "PEDIDA" | "EN_CURSO" | "LISTA" | "ERROR",
  formato: "zip",
  pedida_en: ISODate(…),
  lista_en: ISODate(…) | null,
  archivo_url: "…",          // nombre devuelto por POST /archivos de la OODB
  peso_bytes: 1234567,
  error: null
}
```

Índices: `por_actor` sobre `{actor.id: 1, pedida_en: -1}` y `purga_exportaciones` (TTL de 90 días
sobre `pedida_en`). Validador con `validationAction: "warn"`, igual que el resto.

Por qué Mongo y no una tabla: es estado efímero de un trabajo, no un dato de negocio, y el contrato
del registro ya admite colecciones derivadas de este tipo. Lo que exporta sí es de negocio y sale de
MariaDB + OODB.

**Contenido de la exportación**: cuenta y perfil del tutor, mascotas y prefs, publicaciones,
comentarios, historias, mensajes propios, seguidores/bloqueos, reportes enviados, tickets, y el
resumen de sesiones. Los archivos de la OODB se enlazan o se incluyen, según tamaño.

*Vocabulario*: `datos.exportar` (categoría `cuenta`).

---

## 5. Huecos que aparecen al revisar las pantallas y no estaban en la lista

Se detectaron leyendo los wireframes; sin ellos, las funcionalidades pedidas quedan a medias.

| Hueco | Evidencia | Qué falta |
|---|---|---|
| Epígrafe de la historia | D19 `El sol de la tarde es mi favorito`, D20 «el texto es opcional» | `HISTORIA.texto`; hoy no existe ni en la tabla ni en la clase Rust |
| Audiencia y respuestas por historia | D20/D21 «la audiencia se elige antes de publicar», «desactivar respuestas» | `HISTORIA.audiencia`, `HISTORIA.permite_respuestas` |
| Borrado explícito de historia | D21 «eliminar una historia pide confirmación» | `HISTORIA.eliminada_en` (la OODB necesita saber cuándo borrar) |
| Solicitudes de mensajes | D26 pestaña **Solicitudes** · `Aceptar / Ignorar` | `CONVERSACION.estado ENUM('SOLICITUD','ACTIVA','IGNORADA')` + `solicitante_id` |
| Orden de la bandeja | D26 «ordena por actividad reciente» | `CONVERSACION.ultimo_mensaje_en` (y opcionalmente `ultimo_mensaje_id` para la vista previa «Te compartió una foto») |
| Notas de la conversación | D27 riel «Notas · Recordatorio: paseo el sábado» | `CONVERSACION_PARTICIPANTE.nota VARCHAR(500)` (privada por participante) |
| Sitio web del perfil | D18 campo `Sitio web` | `MASCOTA_PERFIL.sitio_web VARCHAR(255)` |
| Perfil verificado | D23 `Verificado` | `MASCOTA.verificada BOOLEAN` + `verificada_en DATETIME` (va en la fila caliente: se filtra en búsqueda) |
| Notificación de mensaje sin destino | D25 «el aviso abre la conversación» | `NOTIFICACION` no tiene `conversacion_id`/`mensaje_id`: hay que añadirlos y sumarlos a `PROCEDIMIENTOS_H` |
| Mensajería sin auditoría | catálogo de acciones del registro | no hay ninguna acción de mensaje: `mensaje.enviar`, `mensaje.leer`, `conversacion.silenciar` |
| Contraseña sin fecha | D29 «Último cambio hace 3 meses» | `USUARIO_CREDENCIALES.contrasena_actualizada_en` (satélite ya existente) |
| Eliminar cuenta | D28c / D29 «pide escribir el handle» | `USUARIO.eliminada_en` + `MASCOTA.eliminada_en` (borrado lógico en cascada, §5.1) |
| Verificación en dos pasos | D29 «Protege tu cuenta con un código adicional» | tabla o columnas de segundo factor; **fuera del alcance** de este plan, requiere decisión aparte |
| Cola de la OODB sin alimentar | `database/oodb.sql` dice «crea la cola de pendientes y los disparadores que la alimentan», pero el archivo sólo crea la tabla | faltan los disparadores `AFTER INSERT/UPDATE` que alimentan `oodb_pendientes` para las cinco tablas anclables |

### 5.1 Baja de cuenta: borrado lógico en cascada (decidido)

La cuenta **no se borra**: se marca y sus mascotas quedan inactivas. Ninguna fila de `MASCOTA`
desaparece, así que el contenido, los seguidores y las conversaciones se conservan y el perfil puede
seguir respondiendo con el estado «cuenta desactivada» que ya pide D17 («mascota eliminada: el perfil
muestra un estado de cuenta desactivada»).

```sql
-- dentro de MASCOTA: va en la fila caliente porque el feed y las búsquedas la filtran
eliminada_en DATETIME NULL,
INDEX idx_mascota_eliminada (eliminada_en)
```

Reglas de la baja, en una sola transacción:

| Paso | Efecto |
|---|---|
| `USUARIO.eliminada_en = NOW()` y `activo = FALSE` | el login ya devuelve 403 «Esta cuenta ha sido desactivada» con el código actual |
| `MASCOTA.eliminada_en = NOW()` para sus mascotas (`USUARIO_MASCOTA`) | perfil público en estado desactivado; no se puede seguir, ni escribir, ni publicar desde ella |
| `SESION`: `cerrada_en = NOW()`, `cerrada_por = 'CUENTA_ELIMINADA'` + cierre masivo en Mongo | el valor ya existe en el `ENUM` de §4.1, no hay que añadirlo |
| `MASCOTA_PREFERENCIAS`, `USUARIO_PERFIL` y `USUARIO_PREFERENCIAS` | se conservan: la cuenta puede reactivarse |

`USUARIO_MASCOTA` **no** se toca: es la prueba de quién administraba la mascota. Tampoco se borran
las publicaciones ni los comentarios.

**Por qué borrado lógico y no `DELETE`**: `USUARIO_MASCOTA`, `SEGUIMIENTO`, `ME_GUSTA_*` y `REPORTE`
cuelgan con `ON DELETE CASCADE` de `MASCOTA`; un borrado físico arrastraría el trabajo de otras
mascotas (likes, seguimientos, reportes) y dejaría los reportes de moderación sin objeto. El borrado
lógico deja todo coherente y es reversible.

**Lo que sí se libera**: el barrido de historias de más de 30 días (§4.5) sigue corriendo y marca
`eliminada_en` en las historias de una mascota inactiva igual que en las demás, así que el medio
acaba borrándose de la OODB sin tocar las filas.

*Vocabulario*: `cuenta.eliminar` (categoría `cuenta`, sensible).

---

## 6. Paquete de migraciones

Cinco archivos, agrupados por fuente, en `database/migraciones/`. Se aplican **en este orden**.

Idempotencia comprobada en los contenedores (MariaDB 11.4.13): `CREATE TABLE IF NOT EXISTS`,
`ALTER TABLE … ADD COLUMN IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS` sí se pueden repetir;
`ALTER TABLE … ADD CONSTRAINT IF NOT EXISTS` **no existe** en esta versión, así que las claves
foráneas y los `UNIQUE` se envuelven con una guarda sobre `information_schema` o se aplican una sola
vez de forma controlada.

| Archivo | Contenido | Dónde se aplica |
|---|---|---|
| `01-mariadb.sql` | DDL de las tablas nuevas y `ALTER TABLE` de las existentes: `USUARIO`, `USUARIO_PERFIL`, `USUARIO_PREFERENCIAS`, `MASCOTA_PERFIL`, `MASCOTA_PREFERENCIAS`, `SESION`, `CONVERSACION`, `CONVERSACION_PARTICIPANTE`, `MENSAJE`, `MENSAJE_LECTURA`, `HISTORIA`, `HISTORIA_DESTACADA(_ELEMENTO)`, `REPORTE`, `REPORTE_APELACION`, `TICKET_*`, `AYUDA_*`, `NOTIFICACION`, más los `EVENT` de archivo | `dn_a` (maestro) |
| `02-distribucion.sql` | Fragmentos de `MENSAJE_LECTURA` en `dn_a` y `dn_b` con sus disparadores de paridad, `ALTER` del fragmento de `NOTIFICACION` (columnas nuevas), satélite `USUARIO_PERFIL` visto desde Spider, `vUSUARIO` recreada, `sp_mensaje_lectura`, `sp_usuario_crear` recreado con la firma nueva | `dn_b`, `spider` |
| `02b-usuarios.sql` | `pawlector` (sólo lectura) en `dn_a`, para la búsqueda del centro de ayuda; `GRANT EXECUTE` del planificador no hace falta, los eventos corren como `root` o como su definidor | `dn_a` |
| `03-mongo.js` | `collMod` del validador completo de `sesiones`, índice `por_actor_abiertas`, colección `exportaciones` con validador e índices, `upsert` de las acciones nuevas en `acciones` | `mongosh` sobre `pawspace_logs` |
| `04-oodb.md` | Cambios en Rust (§4.6 y §4.13, más la regla de la historia vencida de §4.5): `Tabla::Mensaje`, `Tabla::TicketSoporte`, clases `Mensaje`/`TicketSoporte`, ramas de `mariadb.rs` y `revision.rs` | despliegue del servicio |

**Prerrequisito de DevOps** (lo llevas tú): `event_scheduler` está en `OFF` en los cinco nodos. Hay
que arrancar `dn_a` con `--event-scheduler=ON` en `docker-compose.yml` (o un
`SET GLOBAL event_scheduler = ON` en el script de construcción, sabiendo que no sobrevive a un
reinicio del contenedor) y dejar fuera a las réplicas a propósito.

**En paralelo**, y no después, se actualiza `database/schema.sql` con las mismas definiciones, se
corren las listas de `generar_sql.py` y se revisa el `git diff` de `database/distribuida/`. La regla
es la que ya usa el repositorio: `schema.sql` manda, la migración es el camino para una base que ya
tiene datos.

**Orden interno de `01-mariadb.sql`** (importa por las claves foráneas):

1. `USUARIO`: columnas nuevas (`plan`, `eliminada_en`).
2. `USUARIO_CREDENCIALES`: `contrasena_actualizada_en`.
3. `USUARIO_PERFIL` y `USUARIO_PREFERENCIAS` (necesitan `USUARIO`).
4. `MASCOTA`: `verificada`, `verificada_en`, `eliminada_en` (+ su índice).
5. `MASCOTA_PERFIL`: portada, ubicación, sitio web.
6. `MASCOTA_PREFERENCIAS`.
7. `SESION` (necesita `USUARIO` y `MASCOTA`).
8. `HISTORIA`: columnas nuevas.
9. `HISTORIA_DESTACADA` → `HISTORIA_DESTACADA_ELEMENTO`.
10. `CONVERSACION`: estado, solicitante, último mensaje.
11. `CONVERSACION_PARTICIPANTE`: puntero de lectura, silencio, nota.
12. `MENSAJE`: `historia_id`, `clave_cliente`, `UNIQUE`.
13. `MENSAJE_LECTURA` (necesita `MENSAJE`).
14. `NOTIFICACION`: `conversacion_id`, `mensaje_id`, `ENUM` ampliado.
15. `REPORTE`: `resolucion`, `archivado_en`; luego `REPORTE_APELACION`.
    Ojo: `archivado_en` necesita su propio `EVENT` (90 días desde `resuelto_en`), gemelo del de
    historias.
16. `TICKET_SOPORTE` → `TICKET_MENSAJE`.
17. `AYUDA_CATEGORIA` → `AYUDA_ARTICULO` → `AYUDA_ARTICULO_UTIL`.
18. `EVENT ev_historia_archivo` y `EVENT ev_reporte_archivo`, **sólo en `dn_a`**.
19. Siembra del centro de ayuda (categorías y artículos mínimos) y de `MASCOTA_PREFERENCIAS` para
    las mascotas existentes (`INSERT … SELECT` con los valores por defecto de privacidad).

### Verificación

```bash
# 1. el generador sigue entendiendo el esquema y la distribución queda coherente
./devops/scripts/generar_sql.py && git diff --stat database/distribuida

# 2. build limpio de la base distribuida (incluye las validaciones de fragmentación y replicación)
./devops/scripts/construir-bd.sh --desde-cero

# 3. las validaciones de siempre, una por una, si la base ya existe
docker exec -i pawspace-spider mariadb -uroot -p"$DB_ROOT_PASSWORD" \
  < database/distribuida/validaciones/01-fragmentacion.sql

# 4. Mongo: validador, índices y catálogo
docker exec -i pawspace-mongo mongosh pawspace_logs < database/migraciones/03-mongo.js
docker exec -i pawspace-mongo mongosh pawspace_logs --eval \
  'db.sesiones.getIndexes().map(i=>i.name); db.exportaciones.countDocuments()'

# 5. Rust
cd oodb && cargo test --workspace && cargo clippy --workspace -- -D warnings
```

Criterios de aceptación del paquete: `01-fragmentacion.sql` sigue mostrando las dos mitades, el
disparador de paridad sigue rechazando (`02-el-disparador-rechaza.sql`), `sp_usuario_crear` con la
firma nueva crea la cuenta y su satélite, y una historia vencida **conserva** su objeto en la OODB
mientras una borrada lo pierde.

---

## 7. Fases sugeridas

| Fase | Contenido | Por qué en este orden |
|---|---|---|
| 0 | Vocabulario de acciones nuevo (Mongo + `logs`) y dependencia de autenticación | Todo lo demás registra acciones y exige token |
| 1 | Cuenta y perfil: §4.10 tutor, §4.2 portada, §4.3 ubicación, §4.11 preferencias, baja de cuenta (§5.1) | Un solo pase de `CORTES` y un solo `sp_usuario_crear` |
| 2 | Sesiones: §4.1 | Depende de la tabla `SESION` de la fase 1 y del token de la fase 0 |
| 3 | Mensajería: §4.6 adjuntos, §4.9 idempotencia, §4.7 recibos, §4.8 silencio, §4.4 respuestas, más solicitudes/notas/orden (§5) | Es el bloque con más objetos nuevos y el único que toca la OODB junto con §4.13 |
| 4 | Historias: §4.5 destacadas, texto, audiencia, archivo, `EVENT` de 30 días + cambio de regla del reconciliador | Cambia el ciclo de vida del medio: mejor después de estabilizar la OODB |
| 5 | Moderación y soporte: §4.12 apelaciones (`EVENT` de 90 días), §4.13 tickets, §4.14 ayuda con búsqueda contra `dn_a` | Independientes entre sí |
| 6 | §4.15 descarga de datos | Consume todo lo anterior |

---

## 8. Lo que NO necesita cambios

Para que no se toque lo que ya está:

- **Ver historias, contadores de vistas y me gusta de historias**: `HISTORIA_VISTA` y
  `ME_GUSTA_HISTORIA` existen y están fragmentadas.
- **Bloquear y desbloquear cuentas** (D29, `CMP-87`): `BLOQUEO` existe, con disparador que impide
  bloquearse a sí misma.
- **Reportar contenido** (D30): `REPORTE` con sus cinco objetivos anulables ya está.
- **Notificaciones: marcar leída, marcar todas, contador** (D25): `NOTIFICACION.leida_en` existe.
- **Seguimiento y solicitudes de seguimiento** (D17): `SEGUIMIENTO.estado` ya tiene
  `PENDIENTE/ACEPTADO/RECHAZADO`.
- **Guardados, hashtags, menciones, reposts**: `PUBLICACION_GUARDADA`, `HASHTAG`, `*_MENCION`,
  `PUBLICACION.publicacion_origen_id`.
- **Estado del servicio** (D31): se compone desde los `/health` existentes.
- **Ping de presencia «En línea»** (D27): se deriva de `sesiones.ultima_actividad_en`, que ya existe.

---

## 9. Preguntas que siguen abiertas

Queda una sola, y es de producto: **segundo factor** (D29, «Protege tu cuenta con un código
adicional»). Está fuera de alcance de este plan; si entra, necesita tabla `USUARIO_SEGUNDO_FACTOR`
con el secreto cifrado, códigos de respaldo de un solo uso y su propia acción
`cuenta.segundo_factor` en el vocabulario. No bloquea nada de lo planeado.

Las demás están cerradas en §1:

- verificación de correo: **no hay**, y el distintivo de D28 sale del wireframe;
- baja de cuenta: **borrado lógico** de la cuenta y de sus mascotas (§5.1);
- búsqueda de la ayuda: **contra `dn_a`** con `pawlector` (§4.14);
- avisos: **por cuenta**; privacidad y filtros, **por mascota** (§4.11);
- purgas: **`EVENT` en `dn_a` + llamada programada a `/revisar`** (§4.5).
