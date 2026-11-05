//! Error único del motor.

use crate::oid::Oid;

/// Fallo del motor.
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
    /// Fallo del almacén (`redb`).
    #[error("error del motor: {0}")]
    Motor(#[from] redb::Error),

    /// Fallo al serializar o deserializar un registro.
    #[error("error de formato: {0}")]
    Formato(#[from] serde_json::Error),

    /// Fallo del sistema de archivos.
    #[error("error de entrada/salida: {0}")]
    Io(#[from] std::io::Error),

    /// El OID no existe.
    #[error("no existe el objeto {0}")]
    NoEncontrado(Oid),

    /// El OID existe en el almacén pero no está cargado en memoria.
    #[error("el objeto {0} no está cargado (modo catálogo)")]
    NoCargado(Oid),

    /// El OID guarda un objeto de otra clase.
    #[error("el objeto {oid} no es de la clase {esperado}")]
    TipoEquivocado {
        /// OID del objeto.
        oid: Oid,
        /// Nombre de la clase que se esperaba.
        esperado: &'static str,
    },

    /// El objeto rompe una invariante del dominio.
    #[error("objeto inválido: {0}")]
    Invalido(String),

    /// Dos objetos declaran la misma clave de índice.
    #[error("clave duplicada en el índice «{indice}»: {clave}")]
    ClaveDuplicada {
        /// Nombre del índice.
        indice: &'static str,
        /// Clave ya ocupada.
        clave: String,
    },

    /// Un objeto apunta a un OID que no existe.
    #[error("el objeto {desde} apunta a {hacia}, que no existe")]
    ReferenciaColgada {
        /// Objeto que apunta.
        desde: Oid,
        /// OID inexistente.
        hacia: Oid,
    },

    /// Un objeto con referencias entrantes no se puede borrar.
    #[error("el objeto {oid} tiene {cuantas} referencias entrantes")]
    TieneReferencias {
        /// OID protegido.
        oid: Oid,
        /// Cuántos objetos lo referencian.
        cuantas: usize,
    },

    /// La base usa un formato más nuevo que el que entiende este binario.
    #[error("la base usa el formato {encontrado}; este binario entiende hasta el {esperado}")]
    FormatoDesconocido {
        /// Formato encontrado en el archivo.
        encontrado: u32,
        /// Formato máximo que entiende el binario.
        esperado: u32,
    },

    /// Falta el paso de migración de una clase.
    #[error("la clase «{clase}» no tiene migración desde la versión {version}")]
    SinMigracion {
        /// Clase del registro.
        clase: String,
        /// Versión de origen.
        version: u32,
    },

    /// La operación necesita objetos cargados y la base se abrió en modo catálogo.
    #[error("la operación «{0}» necesita los objetos cargados")]
    SinObjetos(&'static str),
}

macro_rules! desde_redb {
    ($($tipo:ty),+ $(,)?) => {
        $(impl From<$tipo> for Error {
            fn from(e: $tipo) -> Self {
                Error::Motor(e.into())
            }
        })+
    };
}

desde_redb!(
    redb::DatabaseError,
    redb::TransactionError,
    redb::TableError,
    redb::StorageError,
    redb::CommitError,
    redb::CompactionError,
);

/// Resultado del motor.
pub type Resultado<T> = std::result::Result<T, Error>;
