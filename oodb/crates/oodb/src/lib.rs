#![warn(missing_docs)]
//! Motor de base de datos orientada a objetos sobre un clave-valor embebido (`redb`).
//!
//! Guarda objetos con identidad propia: el [`Oid`] lo asigna el motor, nunca el objeto, y
//! sobrevive a la reapertura. En memoria mantiene un mapa de identidad (un objeto por `Oid`),
//! un catálogo de índices y el conjunto de cambios pendientes, que [`Db::commit`] escribe en
//! una sola transacción del almacén.
//!
//! ```
//! use oodb::{Db, Objeto, Oid};
//! use serde::{Deserialize, Serialize};
//!
//! #[derive(Serialize, Deserialize)]
//! struct Nota { texto: String }
//!
//! #[typetag::serde]
//! impl Objeto for Nota {
//!     fn as_any(&self) -> &dyn std::any::Any { self }
//!     fn as_any_mut(&mut self) -> &mut dyn std::any::Any { self }
//!     fn clase(&self) -> &'static str { "Nota" }
//! }
//!
//! let ruta = std::env::temp_dir().join("oodb-doc-ejemplo.redb");
//! let _ = std::fs::remove_file(&ruta);
//!
//! let mut db = Db::abrir(&ruta)?;
//! let oid: Oid = db.insertar(Box::new(Nota { texto: "hola".into() }))?;
//! db.commit()?;
//! assert!(db.objeto(oid)?.as_any().is::<Nota>());
//! # Ok::<(), oodb::Error>(())
//! ```

pub mod consulta;
pub mod error;
pub mod migracion;
pub mod motor;
pub mod objeto;
pub mod oid;

mod almacen;
mod catalogo;

pub use consulta::Pagina;
pub use error::{Error, Resultado};
pub use migracion::Migrador;
pub use motor::{Db, FORMATO, Informe, InformeIntegridad, Opciones, Politica};
pub use objeto::Objeto;
pub use oid::{Oid, Referencia};
