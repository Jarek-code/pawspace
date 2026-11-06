//! Identidad persistente ([`Oid`]) y referencias entre objetos ([`Referencia`]).

use std::fmt;
use std::marker::PhantomData;
use std::str::FromStr;

use serde::{Deserialize, Serialize};

/// Identidad de un objeto, asignada por el motor y persistida con él.
#[derive(Serialize, Deserialize, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Debug)]
#[serde(transparent)]
pub struct Oid(u64);

impl Oid {
    pub(crate) fn nuevo(valor: u64) -> Self {
        Oid(valor)
    }

    /// Número que lo identifica dentro del almacén.
    pub fn valor(self) -> u64 {
        self.0
    }
}

impl fmt::Display for Oid {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "#{}", self.0)
    }
}

impl FromStr for Oid {
    type Err = crate::error::Error;

    fn from_str(texto: &str) -> crate::error::Resultado<Self> {
        let limpio = texto.trim().trim_start_matches('#');
        limpio
            .parse::<u64>()
            .map(Oid::nuevo)
            .map_err(|_| crate::error::Error::Invalido(format!("OID inválido: «{texto}»")))
    }
}

/// Referencia a otro objeto: sólo su `Oid`, con el tipo apuntado como marca.
///
/// `T` admite una superclase (`Referencia<dyn Contenido>`) porque la referencia no
/// desreferencia nada: quien la resuelve es el motor.
pub struct Referencia<T: ?Sized> {
    oid: Oid,
    _marca: PhantomData<fn() -> *const T>,
}

impl<T: ?Sized> Referencia<T> {
    /// Construye la referencia a partir del OID que devolvió el motor al insertar.
    ///
    /// No comprueba que el objeto exista: eso lo hace el motor al resolverla.
    pub fn nueva(oid: Oid) -> Self {
        Referencia {
            oid,
            _marca: PhantomData,
        }
    }

    /// OID del objeto referido.
    pub fn oid(&self) -> Oid {
        self.oid
    }
}

impl<T: ?Sized> Clone for Referencia<T> {
    fn clone(&self) -> Self {
        *self
    }
}

impl<T: ?Sized> Copy for Referencia<T> {}

impl<T: ?Sized> PartialEq for Referencia<T> {
    fn eq(&self, otra: &Self) -> bool {
        self.oid == otra.oid
    }
}

impl<T: ?Sized> Eq for Referencia<T> {}

impl<T: ?Sized> fmt::Debug for Referencia<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "->{}", self.oid)
    }
}

impl<T: ?Sized> Serialize for Referencia<T> {
    fn serialize<S: serde::Serializer>(&self, serializador: S) -> Result<S::Ok, S::Error> {
        self.oid.serialize(serializador)
    }
}

impl<'de, T: ?Sized> Deserialize<'de> for Referencia<T> {
    fn deserialize<D: serde::Deserializer<'de>>(deserializador: D) -> Result<Self, D::Error> {
        Ok(Referencia {
            oid: Oid::deserialize(deserializador)?,
            _marca: PhantomData,
        })
    }
}
