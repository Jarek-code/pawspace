#![warn(missing_docs)]
//! Dominio de PawSpace sobre la OODB: los tres contenidos que aceptan adjuntos y sus archivos.
//!
//! La base relacional guarda el contenido; aquí vive lo que la relacional no expresa bien. Cada
//! contenido **ancla** una fila por `(tabla, registro_id)` y nunca copia sus datos, y los
//! adjuntos son objetos con identidad propia enlazados desde el contenido.
//!
//! Las clases replican las columnas reales del esquema: `PUBLICACION` e `HISTORIA` aceptan
//! imágenes y vídeos (`tipo`, `posicion`, `archivo_url`, `duracion_seg`) y `COMENTARIO` sólo
//! imágenes. `MENSAJE` no tiene adjuntos en la base, así que no es un contenido anclable.

pub mod adjunto;
pub mod ancla;
pub mod contenido;

pub use adjunto::{Adjunto, Imagen, TipoAdjunto, Video, como_adjunto};
pub use ancla::{Ancla, INDICE_ANCLA, Tabla};
pub use contenido::{
    Comentario, Contenido, DatosContenido, Historia, Publicacion, como_contenido,
    como_contenido_mut,
};
