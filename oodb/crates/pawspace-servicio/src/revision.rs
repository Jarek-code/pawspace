//! Reconciliación entre la OODB y la base relacional.

use std::collections::{BTreeMap, HashMap};
use std::str::FromStr;

use oodb::Db;
use pawspace_modelo::{Ancla, Comentario, Historia, INDICE_ANCLA, Publicacion, Tabla};

use serde::Serialize;

use crate::error::{Error, Resultado};
use crate::puerto::{Accion, EstadoFila, Relacional};

/// Cuántas filas van en cada consulta de la pasada.
const LOTE: usize = 500;

/// Qué hizo una pasada de reconciliación.
#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
pub struct InformeRevision {
    /// Anclas revisadas contra MariaDB.
    pub revisadas: usize,
    /// Contenidos borrados por estar eliminados, vencidos o sin fila.
    pub borrados: usize,
    /// Entradas del outbox aplicadas.
    pub aplicadas: usize,
    /// Problemas que no impidieron seguir.
    pub avisos: Vec<String>,
}

/// Crea el contenido que corresponde a la tabla del ancla.
pub fn contenido_nuevo(
    tabla: Tabla,
    ancla: Ancla,
    texto: Option<String>,
) -> Resultado<Box<dyn oodb::Objeto>> {
    let objeto: Box<dyn oodb::Objeto> = match tabla {
        Tabla::Publicacion => Box::new(Publicacion::nueva(ancla, texto)?),
        Tabla::Historia => Box::new(Historia::nueva(ancla)?),
        Tabla::Comentario => Box::new(Comentario::nuevo(ancla, texto.unwrap_or_default())?),
    };
    Ok(objeto)
}

/// Ancla la fila si aún no tenía objeto; devuelve el OID y si lo creó.
pub fn anclar(db: &mut Db, ancla: &Ancla, texto: Option<String>) -> Resultado<(oodb::Oid, bool)> {
    if let Some(oid) = db.por_clave(INDICE_ANCLA, &ancla.clave()) {
        return Ok((oid, false));
    }
    let oid = db.insertar(contenido_nuevo(ancla.tabla(), ancla.clone(), texto)?)?;
    Ok((oid, true))
}

/// Una pasada completa: pendientes del outbox y barrido de anclas vivas.
pub fn revisar(db: &mut Db, relacional: &dyn Relacional) -> Resultado<InformeRevision> {
    let mut informe = InformeRevision::default();

    for pendiente in relacional.pendientes(200)? {
        let resultado = match pendiente.accion {
            Accion::Anclar => match relacional.estado(&pendiente.ancla)? {
                Some(estado) if !estado.fuera_de_vigencia() => {
                    anclar(db, &pendiente.ancla, None).map(|_| ())
                }
                _ => Ok(()),
            },
            Accion::Borrar => borrar_ancla(db, &pendiente.ancla),
        };
        match resultado {
            Ok(()) => {
                relacional.marcar_aplicado(pendiente.id)?;
                informe.aplicadas += 1;
            }
            Err(error) => informe
                .avisos
                .push(format!("pendiente {}: {error}", pendiente.id)),
        }
    }

    let mut por_tabla: BTreeMap<Tabla, Vec<(Ancla, oodb::Oid)>> = BTreeMap::new();
    for (clave, oid) in db.claves_de(INDICE_ANCLA) {
        match Ancla::from_str(&clave) {
            Ok(ancla) => por_tabla
                .entry(ancla.tabla())
                .or_default()
                .push((ancla, oid)),
            Err(error) => informe
                .avisos
                .push(format!("ancla «{clave}» ilegible: {error}")),
        }
    }
    for (tabla, anclas) in por_tabla {
        for lote in anclas.chunks(LOTE) {
            let ids: Vec<u64> = lote.iter().map(|(ancla, _)| ancla.registro_id()).collect();
            let estados: HashMap<u64, EstadoFila> =
                relacional.estados(tabla, &ids)?.into_iter().collect();
            for (ancla, oid) in lote {
                informe.revisadas += 1;
                let fuera = estados
                    .get(&ancla.registro_id())
                    .is_none_or(EstadoFila::fuera_de_vigencia);
                if fuera && db.objeto(*oid).is_ok() {
                    db.eliminar(*oid)?;
                    informe.borrados += 1;
                }
            }
        }
    }

    db.commit()?;
    Ok(informe)
}

/// Borra el contenido anclado a esa fila, si existe.
pub fn borrar_ancla(db: &mut Db, ancla: &Ancla) -> Resultado<()> {
    if let Some(oid) = db.por_clave(INDICE_ANCLA, &ancla.clave()) {
        db.eliminar(oid)?;
    }
    Ok(())
}

/// Adjunta un archivo ya creado al contenido anclado a la fila.
pub fn adjuntar(db: &mut Db, ancla: &Ancla, adjunto: oodb::Oid) -> Resultado<()> {
    let oid = db
        .por_clave(INDICE_ANCLA, &ancla.clave())
        .ok_or_else(|| Error::Peticion(format!("no hay contenido anclado a {ancla}")))?;
    let tipo = {
        let objeto = db.objeto(adjunto)?;
        pawspace_modelo::como_adjunto(objeto)
            .ok_or_else(|| Error::Peticion(format!("{adjunto} no es un adjunto")))?
            .tipo()
    };
    if tipo == pawspace_modelo::TipoAdjunto::Video && !ancla.tabla().admite_video() {
        return Err(Error::Peticion(format!(
            "{} sólo admite imágenes",
            ancla.tabla()
        )));
    }
    let objeto = db.objeto_mut(oid)?;
    let contenido = pawspace_modelo::como_contenido_mut(objeto)
        .ok_or_else(|| Error::Peticion(format!("{oid} no es un contenido")))?;
    contenido.adjuntar(oodb::Referencia::nueva(adjunto))?;
    Ok(())
}
