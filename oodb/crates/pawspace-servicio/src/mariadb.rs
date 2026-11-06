//! Adaptador del puerto relacional contra MariaDB (nodo Spider).

use mysql::prelude::Queryable;
use mysql::{Opts, Pool};
use pawspace_modelo::{Ancla, Tabla};

use crate::error::{Error, Resultado};
use crate::puerto::{EstadoFila, Pendiente, Relacional};

/// Cola de trabajos que la aplicación escribe en la misma transacción que sus filas.
pub const DDL_OUTBOX: &str = "\
CREATE TABLE IF NOT EXISTS oodb_pendientes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tabla VARCHAR(16) NOT NULL,
    registro_id BIGINT UNSIGNED NOT NULL,
    accion ENUM('ANCLAR','BORRAR') NOT NULL,
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aplicado_en DATETIME NULL,
    CONSTRAINT pk_oodb_pendientes PRIMARY KEY (id),
    INDEX idx_oodb_pendientes (aplicado_en, id)
) ENGINE=InnoDB";

/// Consulta por lotes que devuelve `(id, eliminada, vencida)`; las tablas son fijas.
///
/// Los identificadores van escritos en la consulta y no como parámetros: son `u64` que salen
/// del propio almacén, así que no hay texto externo que inyectar.
fn consulta(tabla: Tabla, ids: &[u64]) -> String {
    let lista = ids.iter().map(u64::to_string).collect::<Vec<_>>().join(",");
    match tabla {
        Tabla::Publicacion => format!(
            "SELECT id, (eliminado_en IS NOT NULL) + 0, 0 FROM PUBLICACION WHERE id IN ({lista})"
        ),
        Tabla::Historia => {
            format!("SELECT id, 0, (vence_en <= NOW()) + 0 FROM HISTORIA WHERE id IN ({lista})")
        }
        Tabla::Comentario => format!(
            "SELECT id, (eliminado_en IS NOT NULL) + 0, 0 FROM COMENTARIO WHERE id IN ({lista})"
        ),
    }
}

/// Implementación del puerto sobre un pool de conexiones.
pub struct MariaDb {
    pool: Pool,
}

impl MariaDb {
    /// Abre el pool con una URL `mysql://usuario:clave@host:puerto/base`.
    pub fn conectar(url: &str) -> Resultado<Self> {
        let opciones = Opts::from_url(url).map_err(|e| Error::MariaDb(e.to_string()))?;
        let pool = Pool::new(opciones)?;
        Ok(MariaDb { pool })
    }

    /// Crea la tabla del outbox si no existe.
    pub fn asegurar_esquema(&self) -> Resultado<()> {
        let mut conexion = self.pool.get_conn()?;
        conexion.query_drop(DDL_OUTBOX)?;
        Ok(())
    }
}

impl Relacional for MariaDb {
    fn estados(&self, tabla: Tabla, ids: &[u64]) -> Resultado<Vec<(u64, EstadoFila)>> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }
        let mut conexion = self.pool.get_conn()?;
        let filas: Vec<(u64, i64, i64)> = conexion.query(consulta(tabla, ids))?;
        Ok(filas
            .into_iter()
            .map(|(id, eliminada, vencida)| {
                (
                    id,
                    EstadoFila {
                        eliminada: eliminada != 0,
                        vencida: vencida != 0,
                    },
                )
            })
            .collect())
    }

    fn pendientes(&self, limite: usize) -> Resultado<Vec<Pendiente>> {
        let mut conexion = self.pool.get_conn()?;
        let consulta = format!(
            "SELECT id, tabla, registro_id, accion FROM oodb_pendientes \
             WHERE aplicado_en IS NULL ORDER BY id LIMIT {}",
            limite.max(1)
        );
        let filas: Vec<(u64, String, u64, String)> = conexion.query(consulta)?;
        filas
            .into_iter()
            .map(|(id, tabla, registro_id, accion)| {
                let tabla = Tabla::desde_nombre(&tabla).ok_or_else(|| {
                    Error::Relacional(format!("tabla desconocida en el outbox: «{tabla}»"))
                })?;
                Ok(Pendiente {
                    id,
                    ancla: Ancla::nueva(tabla, registro_id)?,
                    accion: accion.parse()?,
                })
            })
            .collect()
    }

    fn marcar_aplicado(&self, id: u64) -> Resultado<()> {
        let mut conexion = self.pool.get_conn()?;
        conexion.exec_drop(
            "UPDATE oodb_pendientes SET aplicado_en = NOW() WHERE id = ?",
            (id,),
        )?;
        Ok(())
    }
}
