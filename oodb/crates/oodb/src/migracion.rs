//! Migración de registros entre versiones del formato.

use std::collections::BTreeMap;

use serde_json::Value;

use crate::error::{Error, Resultado};
use crate::motor::FORMATO;

type Paso = fn(Value) -> Resultado<Value>;

/// Registro de pasos de migración, uno por clase y versión de origen.
///
/// Un paso lleva un registro de la versión `desde` a la `desde + 1`. Si un registro llega
/// con la versión actual no se toca; si le falta el campo `v` se supone la actual.
#[derive(Default)]
pub struct Migrador {
    pasos: BTreeMap<String, BTreeMap<u32, Paso>>,
}

impl Migrador {
    /// Registro vacío.
    pub fn nuevo() -> Self {
        Self::default()
    }

    /// Añade el paso que migra un registro de `clase` desde `desde`.
    pub fn paso(&mut self, clase: &str, desde: u32, paso: Paso) -> &mut Self {
        self.pasos
            .entry(clase.to_string())
            .or_default()
            .insert(desde, paso);
        self
    }

    /// Encadena los pasos que faltan hasta la versión actual del formato.
    pub(crate) fn migrar(&self, clase: &str, desde: u32, mut valor: Value) -> Resultado<Value> {
        let mut version = desde;
        while version < FORMATO {
            let paso = self
                .pasos
                .get(clase)
                .and_then(|pasos| pasos.get(&version))
                .copied()
                .ok_or_else(|| Error::SinMigracion {
                    clase: clase.to_string(),
                    version,
                })?;
            valor = paso(valor)?;
            version += 1;
        }
        if let Value::Object(mapa) = &mut valor {
            mapa.insert("v".to_string(), Value::from(FORMATO));
        }
        Ok(valor)
    }
}
