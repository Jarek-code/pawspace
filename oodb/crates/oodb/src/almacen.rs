//! El clave-valor de debajo: objetos, índices y metadatos en `redb`.

use std::fs;
use std::path::{Path, PathBuf};

use redb::{Database, ReadableDatabase, ReadableTable, TableDefinition};

use crate::error::Resultado;
use crate::oid::Oid;

const OBJETOS: TableDefinition<u64, &[u8]> = TableDefinition::new("objetos");
const CLASES: TableDefinition<u64, &str> = TableDefinition::new("clases");
const INDICES: TableDefinition<&str, u64> = TableDefinition::new("indices");
const META: TableDefinition<&str, u64> = TableDefinition::new("meta");
const SALEN: TableDefinition<&str, u64> = TableDefinition::new("aristas_salen");
const ENTRAN: TableDefinition<&str, u64> = TableDefinition::new("aristas_entran");

/// Separador de las claves compuestas de índice (`indice\x1fclave`).
pub(crate) const SEPARADOR: char = '\u{1f}';

/// Ancho fijo de los OID dentro de las claves de arista, para poder recorrerlas por prefijo.
const ANCHO: usize = 20;

fn clave_arista(uno: Oid, otro: Oid) -> String {
    format!("{:0ANCHO$}{SEPARADOR}{:0ANCHO$}", uno.valor(), otro.valor())
}

/// Objeto que se va a escribir.
pub(crate) struct Alta {
    pub(crate) oid: Oid,
    pub(crate) clase: &'static str,
    pub(crate) claves: Vec<(&'static str, String)>,
    pub(crate) bytes: Vec<u8>,
}

/// Objeto que se va a borrar.
pub(crate) struct Baja {
    pub(crate) oid: Oid,
    pub(crate) claves: Vec<(&'static str, String)>,
}

/// Todo lo que cambia en una confirmación.
pub(crate) struct Cambios<'a> {
    pub(crate) altas: &'a [Alta],
    pub(crate) bajas: &'a [Baja],
    pub(crate) aristas_altas: &'a [(Oid, Oid)],
    pub(crate) aristas_bajas: &'a [(Oid, Oid)],
    pub(crate) meta: &'a [(&'a str, u64)],
}

pub(crate) struct Almacen {
    motor: Database,
    ruta: PathBuf,
}

fn compuesta(indice: &str, clave: &str) -> String {
    format!("{indice}{SEPARADOR}{clave}")
}

impl Almacen {
    pub(crate) fn abrir(ruta: &Path) -> Resultado<Self> {
        if let Some(directorio) = ruta.parent().filter(|d| !d.as_os_str().is_empty()) {
            fs::create_dir_all(directorio)?;
        }
        let motor = Database::create(ruta)?;
        let transaccion = motor.begin_write()?;
        {
            transaccion.open_table(OBJETOS)?;
            transaccion.open_table(CLASES)?;
            transaccion.open_table(INDICES)?;
            transaccion.open_table(META)?;
            transaccion.open_table(SALEN)?;
            transaccion.open_table(ENTRAN)?;
        }
        transaccion.commit()?;
        Ok(Almacen {
            motor,
            ruta: ruta.to_path_buf(),
        })
    }

    pub(crate) fn ruta(&self) -> &Path {
        &self.ruta
    }

    pub(crate) fn leer_objetos(&self) -> Resultado<Vec<(Oid, Vec<u8>)>> {
        let transaccion = self.motor.begin_read()?;
        let tabla = transaccion.open_table(OBJETOS)?;
        let mut objetos = Vec::new();
        for fila in tabla.iter()? {
            let (clave, valor) = fila?;
            objetos.push((Oid::nuevo(clave.value()), valor.value().to_vec()));
        }
        Ok(objetos)
    }

    pub(crate) fn leer_uno(&self, oid: Oid) -> Resultado<Option<Vec<u8>>> {
        let transaccion = self.motor.begin_read()?;
        let tabla = transaccion.open_table(OBJETOS)?;
        Ok(tabla.get(oid.valor())?.map(|valor| valor.value().to_vec()))
    }

    pub(crate) fn leer_clases(&self) -> Resultado<Vec<(Oid, String)>> {
        let transaccion = self.motor.begin_read()?;
        let tabla = transaccion.open_table(CLASES)?;
        let mut clases = Vec::new();
        for fila in tabla.iter()? {
            let (clave, valor) = fila?;
            clases.push((Oid::nuevo(clave.value()), valor.value().to_string()));
        }
        Ok(clases)
    }

    pub(crate) fn leer_indices(&self) -> Resultado<Vec<(String, String, Oid)>> {
        let transaccion = self.motor.begin_read()?;
        let tabla = transaccion.open_table(INDICES)?;
        let mut indices = Vec::new();
        for fila in tabla.iter()? {
            let (clave, valor) = fila?;
            let compuesta = clave.value().to_string();
            if let Some((indice, resto)) = compuesta.split_once(SEPARADOR) {
                indices.push((
                    indice.to_string(),
                    resto.to_string(),
                    Oid::nuevo(valor.value()),
                ));
            }
        }
        Ok(indices)
    }

    pub(crate) fn leer_aristas(&self) -> Resultado<Vec<(Oid, Oid)>> {
        let transaccion = self.motor.begin_read()?;
        let tabla = transaccion.open_table(SALEN)?;
        let mut aristas = Vec::new();
        for fila in tabla.iter()? {
            let (clave, valor) = fila?;
            let desde = clave.value().split(SEPARADOR).next().unwrap_or_default();
            if let Ok(desde) = desde.parse::<u64>() {
                aristas.push((Oid::nuevo(desde), Oid::nuevo(valor.value())));
            }
        }
        Ok(aristas)
    }

    pub(crate) fn leer_meta(&self, clave: &str) -> Resultado<Option<u64>> {
        let transaccion = self.motor.begin_read()?;
        let tabla = transaccion.open_table(META)?;
        Ok(tabla.get(clave)?.map(|valor| valor.value()))
    }

    /// Aplica altas, bajas y metadatos en una sola transacción: o todo, o nada.
    pub(crate) fn aplicar(&self, cambios: Cambios<'_>) -> Resultado<()> {
        let transaccion = self.motor.begin_write()?;
        {
            let mut objetos = transaccion.open_table(OBJETOS)?;
            let mut clases = transaccion.open_table(CLASES)?;
            let mut indices = transaccion.open_table(INDICES)?;
            let mut meta = transaccion.open_table(META)?;
            let mut salen = transaccion.open_table(SALEN)?;
            let mut entran = transaccion.open_table(ENTRAN)?;

            for alta in cambios.altas {
                objetos.insert(alta.oid.valor(), alta.bytes.as_slice())?;
                clases.insert(alta.oid.valor(), alta.clase)?;
                for (indice, clave) in &alta.claves {
                    indices.insert(compuesta(indice, clave).as_str(), alta.oid.valor())?;
                }
            }

            for baja in cambios.bajas {
                objetos.remove(baja.oid.valor())?;
                clases.remove(baja.oid.valor())?;
                for (indice, clave) in &baja.claves {
                    indices.remove(compuesta(indice, clave).as_str())?;
                }
            }

            for (desde, hacia) in cambios.aristas_altas {
                salen.insert(clave_arista(*desde, *hacia).as_str(), hacia.valor())?;
                entran.insert(clave_arista(*hacia, *desde).as_str(), desde.valor())?;
            }

            for (desde, hacia) in cambios.aristas_bajas {
                salen.remove(clave_arista(*desde, *hacia).as_str())?;
                entran.remove(clave_arista(*hacia, *desde).as_str())?;
            }

            for (clave, valor) in cambios.meta {
                meta.insert(*clave, *valor)?;
            }
        }
        transaccion.commit()?;
        Ok(())
    }

    /// Compacta el archivo; devuelve si hubo algo que compactar.
    pub(crate) fn compactar(&mut self) -> Resultado<bool> {
        Ok(self.motor.compact()?)
    }

    /// Comprueba las estructuras internas del almacén.
    pub(crate) fn verificar(&mut self) -> Resultado<bool> {
        Ok(self.motor.check_integrity()?)
    }

    /// Tamaño del archivo en bytes.
    pub(crate) fn tamano(&self) -> Resultado<u64> {
        Ok(fs::metadata(&self.ruta)?.len())
    }
}
