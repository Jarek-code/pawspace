//! Lo que el servicio necesita saber de la base relacional.

use std::str::FromStr;

use pawspace_modelo::{Ancla, Tabla};

use crate::error::{Error, Resultado};

/// Estado de la fila relacional a la que se ancla un contenido.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct EstadoFila {
    /// La fila está marcada como eliminada (`eliminado_en`).
    pub eliminada: bool,
    /// La fila venció, como una historia pasada de `vence_en`.
    pub vencida: bool,
}

impl EstadoFila {
    /// Si el contenido ya no debe existir en la OODB.
    pub fn fuera_de_vigencia(&self) -> bool {
        self.eliminada || self.vencida
    }
}

/// Acción pendiente anotada en el outbox de MariaDB.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Accion {
    /// Crear el objeto del contenido.
    Anclar,
    /// Borrar el objeto y sus adjuntos.
    Borrar,
}

impl FromStr for Accion {
    type Err = Error;

    fn from_str(texto: &str) -> Resultado<Self> {
        match texto.trim().to_ascii_uppercase().as_str() {
            "ANCLAR" => Ok(Accion::Anclar),
            "BORRAR" => Ok(Accion::Borrar),
            otro => Err(Error::Relacional(format!("acción desconocida «{otro}»"))),
        }
    }
}

/// Entrada del outbox pendiente de aplicar.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Pendiente {
    /// Clave de la entrada.
    pub id: u64,
    /// Fila afectada.
    pub ancla: Ancla,
    /// Qué hay que hacer.
    pub accion: Accion,
}

/// Puerto hacia la base relacional: lo implementa el adaptador de MariaDB.
pub trait Relacional: Send + Sync {
    /// Estado de varias filas de la misma tabla; sólo devuelve las que existen.
    ///
    /// Va por lotes porque el reconciliador revisa miles de anclas por pasada: una consulta
    /// por ancla no aguanta el volumen.
    fn estados(&self, tabla: Tabla, ids: &[u64]) -> Resultado<Vec<(u64, EstadoFila)>>;

    /// Estado de la fila de un ancla, o `None` si ya no existe.
    fn estado(&self, ancla: &Ancla) -> Resultado<Option<EstadoFila>> {
        let estados = self.estados(ancla.tabla(), &[ancla.registro_id()])?;
        Ok(estados.into_iter().next().map(|(_, estado)| estado))
    }

    /// Entradas del outbox sin aplicar, en orden.
    fn pendientes(&self, limite: usize) -> Resultado<Vec<Pendiente>>;

    /// Marca una entrada del outbox como aplicada.
    fn marcar_aplicado(&self, id: u64) -> Resultado<()>;

    /// Tablas que este puerto sabe consultar.
    fn tablas(&self) -> &'static [Tabla] {
        &Tabla::TODAS
    }
}

/// Puerto sin conexión: todo existe y no hay pendientes.
///
/// Sirve para levantar el servicio sin MariaDB, para la CLI y para las pruebas.
#[derive(Debug, Default)]
pub struct SinRelacional;

impl Relacional for SinRelacional {
    fn estados(&self, _tabla: Tabla, ids: &[u64]) -> Resultado<Vec<(u64, EstadoFila)>> {
        Ok(ids.iter().map(|id| (*id, EstadoFila::default())).collect())
    }

    fn pendientes(&self, _limite: usize) -> Resultado<Vec<Pendiente>> {
        Ok(Vec::new())
    }

    fn marcar_aplicado(&self, _id: u64) -> Resultado<()> {
        Ok(())
    }
}
