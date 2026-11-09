//! El contrato que cumple todo objeto persistente.

use std::any::Any;

use crate::oid::Oid;

/// Objeto persistente: identidad por [`Oid`], clase estable y enlaces declarados.
///
/// La etiqueta `clase` del registro la escribe `typetag` al serializar y el nombre que
/// devuelve [`Objeto::clase`] es el que usa el catálogo y la interfaz.
#[typetag::serde(tag = "clase")]
pub trait Objeto: Any + Send {
    /// Vista como [`Any`], para bajar a la clase concreta.
    fn as_any(&self) -> &dyn Any;

    /// Vista mutable como [`Any`].
    fn as_any_mut(&mut self) -> &mut dyn Any;

    /// Nombre estable de la clase.
    fn clase(&self) -> &'static str;

    /// Claves de índice secundario que declara el objeto, únicas en el motor.
    ///
    /// El primer elemento nombra el índice y el segundo es la clave dentro de él.
    fn claves(&self) -> Vec<(&'static str, String)> {
        Vec::new()
    }

    /// OIDs a los que apunta el objeto, para comprobar la integridad referencial.
    fn referencias(&self) -> Vec<Oid> {
        Vec::new()
    }
}
