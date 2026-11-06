#![warn(missing_docs)]
//! Servicio HTTP de la OODB de PawSpace.
//!
//! Es la fuente de verdad de los adjuntos: la API ancla contenidos a su fila de MariaDB,
//! cuelga imágenes y vídeos de ellos y reconcilia el almacén con la base relacional cuando una
//! fila se elimina, vence o desaparece.
//!
//! Cada petición que escribe confirma en el acto (una transacción del almacén), así que un
//! fallo posterior en la red no deja objetos a medias.

pub mod api;
pub mod archivos;
pub mod config;
pub mod error;
pub mod mariadb;
pub mod puerto;
pub mod revision;

pub use api::{Estado, router};
pub use config::Config;
pub use error::{Error, Resultado};
pub use puerto::{Accion, EstadoFila, Pendiente, Relacional, SinRelacional};
pub use revision::InformeRevision;
