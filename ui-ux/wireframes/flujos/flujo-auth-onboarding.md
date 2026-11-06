# Flujo — Auth y onboarding

Documento de referencia para los wireframes de autenticación y onboarding.
Complementa el [índice de wireframes](../README.md) y el
[sistema de componentes](../../design-system/07-componentes.md).

La verificación de correo, la recuperación y el restablecimiento de contraseña quedaron fuera
del alcance del producto. Los tableros D03, D04 y D05 se retiraron.

## Diagrama

```mermaid
flowchart TD
    A[Inicio] --> B{¿Tiene cuenta?}
    B -- No --> C[D02 Registro de persona]
    B -- Sí --> D[D01 Login]
    C -->|Cuenta creada| F[D06 Onboarding 1/4 Especie]
    D -->|Credenciales correctas| G{¿Tiene mascotas?}
    D -->|Error| D
    C -->|Error| C
    G -- No --> F
    G -- Una --> J[D10 Onboarding completado]
    G -- Varias --> K[D11 Seleccionar mascota activa]
    K --> L[Entrar como mascota]
    J --> L
    F -->|Elige Otra| F1[D06b Onboarding 1/4 Especie (otra)]
    F --> F2[F02 Datos]
    F1 --> F2
    F2 --> F3[F03 Foto y biografía]
    F3 --> F4[F04 Privacidad]
    F4 --> J
    D -.-> M[D12 Estados del sistema]
    F -.-> M
    F1 -.-> M
```

## Recorrido principal

1. La persona llega a **D01 Login** o **D02 Registro**.
2. Si se registra, entra directamente al onboarding de su primera mascota:
   - **D06** elige especie.
   - **D06b** aparece si elige **Otra**: busca la especie en el catálogo y la selecciona.
   - **D07** captura nombre, usuario, raza, sexo y fecha.
   - **D08** sube foto y biografía (opcionales).
   - **D09** decide si el perfil es público o privado.
3. **D10** confirma que la mascota ya tiene su espacio.
4. Si la persona ya tenía mascotas, **D11** le permite elegir con cuál entrar.
5. Entra a la aplicación como la mascota seleccionada.

## Pantallas

| ID | Ruta propuesta | Objetivo | Acción principal | Estados |
|---|---|---|---|---|
| D01 | `/entrar` | Autenticar a la persona | Entrar | Default, carga |
| D01b | `/entrar` | Mostrar error de credenciales | Corregir e intentar de nuevo | Error de credenciales |
| D02 | `/crear-cuenta` | Crear la cuenta de persona | Crear cuenta | Default, carga |
| D02b | `/crear-cuenta` | Mostrar errores de validación | Corregir y crear cuenta | Error de validación |
| D06 | `/onboarding/especie` | Elegir especie | Continuar | Default |
| D06b | `/onboarding/especie/otra` | Buscar y elegir otra especie | Continuar | Lista abierta, sin resultados, error de carga |
| D07 | `/onboarding/datos` | Capturar datos de la mascota | Continuar | Default, error |
| D08 | `/onboarding/perfil` | Foto y biografía | Continuar / Omitir | Default, archivo inválido |
| D09 | `/onboarding/privacidad` | Elegir visibilidad | Terminar | Default |
| D10 | `/onboarding/listo` | Celebrar y entrar | Entrar a PawSpace | Default |
| D11 | `/elegir-mascota` | Elegir mascota activa | Entrar como {nombre} | Una, varias, vacío |
| D12 | — | Comunicar estados del sistema | Reintentar / Entrar | Carga, red, sesión, desactivada |

> Los IDs D03, D04 y D05 quedan retirados y no se reutilizan para no romper referencias.

## Reglas de navegación

- El onboarding no se puede saltar: si la persona no tiene mascotas, no entra al producto.
- Se puede volver a un paso anterior; no se puede avanzar sin completar los campos
  obligatorios (especie, nombre y nombre de usuario).
- La foto, la biografía, la raza, el sexo y la fecha son opcionales.
- Elegir **Otra** en D06 abre **D06b**; no es un paso nuevo del stepper: sigue siendo el
  paso 1 de 4.
- D06b muestra un desplegable con las especies que PawSpace mantiene en su catálogo y un
  buscador que filtra por nombre mientras la persona escribe.
- La persona no captura especies libremente: elige del catálogo. Si su especie no aparece,
  D06b la envía a soporte para agregarla.
- Continuar en D06b se habilita solo cuando hay una especie seleccionada; Volver regresa a D06
  sin perder la elección previa.
- No hay verificación de correo, recuperación ni restablecimiento de contraseña en este alcance.
- El correo se valida en formato y se usa como identificador de la cuenta.
- Si la sesión expira, se muestra **D12** con la acción “Entrar de nuevo” y se conserva la
  intención de volver a la pantalla anterior.
- Si la persona tiene una sola mascota y ya está activa, **D11** se omite.
- Si tiene varias, **D11** aparece después del login y después de crear una nueva mascota.
- El cambio de mascota activa vuelve a **D11** sin cerrar la sesión de la persona.

## Casos límite

| Caso | Comportamiento |
|---|---|
| Correo ya registrado | Mensaje genérico y enlace a iniciar sesión. |
| Credenciales incorrectas | Error en D01b; no revela si el correo existe. |
| Nombre de usuario ocupado | Error en D07, sin perder los demás campos. |
| Archivo demasiado grande | Error en D08; se conserva el resto del formulario. |
| Sin conexión | Estado D12; los datos del formulario se conservan en memoria. |
| Cuenta desactivada | Estado D12 con contacto de soporte. |
| Persona con varias mascotas | D11 después del login. |
| Persona sin mascotas | Onboarding obligatorio. |
| Especie no listada | D06b muestra el enlace a soporte; no permite continuar con texto libre. |
| Búsqueda sin coincidencias | Estado vacío dentro del desplegable, con el enlace a soporte. |
| Catálogo no disponible | Estado D12; se conserva la elección previa de D06. |
| Mascota privada | Se muestra la opción en D09; el perfil no aparece en búsquedas. |

## Decisiones de UX

- **Una decisión por paso.** El onboarding separa especie, datos, perfil y privacidad.
- **Catálogo curado.** PawSpace mantiene la lista de especies; la persona busca y elige, no
  escribe una especie libre. Si no aparece, soporte la agrega.
- **Búsqueda dentro del desplegable.** El buscador filtra el catálogo sin sacar a la persona
  del paso 1; la selección queda visible en el campo.
- **Progreso visible.** El stepper muestra 4 pasos en escritorio; en móvil, “Paso 2 de 4” y
  una barra.
- **Opcionales explícitos.** Todo lo que no es obligatorio se marca como “(opcional)”.
- **Sin pasos intermedios.** Al registrarse, la persona pasa directo al onboarding.
- **Sin sorpresas.** La privacidad se elige antes de terminar, no después.
- **La mascota es la protagonista.** Los mensajes de éxito usan su nombre, no “tu cuenta”.
- **Errores accionables.** Cada error dice qué pasó y cómo resolverlo.
- **Nada se pierde.** Ante un error de red, el formulario conserva lo escrito.
