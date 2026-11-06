//! La fila relacional a la que se ancla un contenido.

use std::fmt;
use std::str::FromStr;

use oodb::Error;
use oodb::error::Resultado;
use serde::{Deserialize, Serialize};

/// Índice del motor donde se registra el ancla de cada contenido.
pub const INDICE_ANCLA: &str = "ancla";

/// Tabla de MariaDB con la que se puede anclar un contenido.
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum Tabla {
    /// Publicación del muro.
    Publicacion,
    /// Historia que vence.
    Historia,
    /// Comentario de una publicación.
    Comentario,
}

impl Tabla {
    /// Las tres tablas anclables.
    pub const TODAS: [Tabla; 3] = [Tabla::Publicacion, Tabla::Historia, Tabla::Comentario];

    /// Nombre de la tabla en el esquema.
    pub fn nombre(self) -> &'static str {
        match self {
            Tabla::Publicacion => "PUBLICACION",
            Tabla::Historia => "HISTORIA",
            Tabla::Comentario => "COMENTARIO",
        }
    }

    /// Si el contenido de esa tabla admite vídeo además de imagen.
    pub fn admite_video(self) -> bool {
        match self {
            Tabla::Publicacion | Tabla::Historia => true,
            Tabla::Comentario => false,
        }
    }

    /// Busca la tabla por su nombre en el esquema.
    pub fn desde_nombre(nombre: &str) -> Option<Tabla> {
        Tabla::TODAS
            .into_iter()
            .find(|tabla| tabla.nombre().eq_ignore_ascii_case(nombre))
    }
}

impl fmt::Display for Tabla {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.nombre())
    }
}

impl FromStr for Tabla {
    type Err = Error;

    fn from_str(texto: &str) -> Resultado<Self> {
        Tabla::desde_nombre(texto).ok_or_else(|| {
            Error::Invalido(format!(
                "tabla desconocida «{texto}»; se espera PUBLICACION, HISTORIA o COMENTARIO"
            ))
        })
    }
}

/// Fila concreta a la que se ancla un contenido: `(tabla, registro_id)`.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Ancla {
    tabla: Tabla,
    registro_id: u64,
}

impl Ancla {
    /// Ancla de la fila `registro_id` de `tabla`.
    pub fn nueva(tabla: Tabla, registro_id: u64) -> Resultado<Self> {
        if registro_id == 0 {
            return Err(Error::Invalido("el id de la fila no puede ser 0".into()));
        }
        Ok(Ancla { tabla, registro_id })
    }

    /// Tabla anclada.
    pub fn tabla(&self) -> Tabla {
        self.tabla
    }

    /// Clave primaria de la fila anclada.
    pub fn registro_id(&self) -> u64 {
        self.registro_id
    }

    /// Clave que ocupa en el índice del motor (`PUBLICACION:7`).
    pub fn clave(&self) -> String {
        format!("{}:{}", self.tabla.nombre(), self.registro_id)
    }
}

impl fmt::Display for Ancla {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}.id = {}", self.tabla.nombre(), self.registro_id)
    }
}

impl FromStr for Ancla {
    type Err = Error;

    fn from_str(texto: &str) -> Resultado<Self> {
        let (tabla, id) = texto
            .split_once([':', '.', '/'])
            .ok_or_else(|| Error::Invalido(format!("ancla incompleta «{texto}»")))?;
        let tabla: Tabla = tabla.parse()?;
        let registro_id = id
            .trim()
            .parse::<u64>()
            .map_err(|_| Error::Invalido(format!("id inválido en «{texto}»")))?;
        Ancla::nueva(tabla, registro_id)
    }
}
