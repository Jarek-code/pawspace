//! Error del servicio.

/// Fallo del servicio.
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
    /// Fallo del motor de objetos.
    #[error(transparent)]
    Objetos(#[from] oodb::Error),

    /// Fallo al hablar con MariaDB.
    #[error("error de MariaDB: {0}")]
    MariaDb(String),

    /// El puerto relacional devolvió algo inesperado.
    #[error("error relacional: {0}")]
    Relacional(String),

    /// Configuración incompleta.
    #[error("configuración inválida: {0}")]
    Configuracion(String),

    /// Una petición pedía algo que el dominio no admite.
    #[error("{0}")]
    Peticion(String),

    /// No hay ningún contenido anclado a esa fila.
    #[error("no hay contenido anclado a {0}")]
    NoAnclado(String),

    /// Fallo del sistema de archivos al guardar o leer un adjunto.
    #[error("error de disco: {0}")]
    Io(#[from] std::io::Error),

    /// El archivo no existe en la carpeta de adjuntos.
    #[error("no está el archivo «{0}»")]
    SinArchivo(String),

    /// El archivo supera el tamaño admitido.
    #[error("el archivo supera el máximo de {0} bytes")]
    DemasiadoGrande(usize),

    /// La petición no trae el token de administración.
    #[error("no autorizado")]
    NoAutorizado,
}

impl From<mysql::Error> for Error {
    fn from(error: mysql::Error) -> Self {
        Error::MariaDb(error.to_string())
    }
}

/// Resultado del servicio.
pub type Resultado<T> = std::result::Result<T, Error>;
