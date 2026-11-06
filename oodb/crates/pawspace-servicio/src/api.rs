//! Rutas HTTP del servicio.

use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use oodb::{Db, Oid};
use pawspace_modelo::{
    Ancla, Comentario, INDICE_ANCLA, Imagen, Publicacion, Tabla, Video, como_adjunto,
    como_contenido, como_contenido_mut,
};
use serde::Deserialize;
use serde_json::{Value, json};

use crate::archivos;
use crate::error::{Error, Resultado};
use crate::puerto::Relacional;
use crate::revision;

/// Estado compartido por las rutas.
#[derive(Clone)]
pub struct Estado {
    db: Arc<Mutex<Db>>,
    relacional: Arc<dyn Relacional>,
    token: Option<String>,
    archivos: Arc<PathBuf>,
    publica: Option<String>,
    contador: Arc<AtomicU64>,
}

impl Estado {
    /// Estado con la base abierta, el puerto relacional y la carpeta de archivos.
    pub fn nuevo(
        db: Db,
        relacional: Arc<dyn Relacional>,
        token: Option<String>,
        archivos: impl Into<PathBuf>,
        publica: Option<String>,
    ) -> Self {
        Estado {
            db: Arc::new(Mutex::new(db)),
            relacional,
            token,
            archivos: Arc::new(archivos.into()),
            publica,
            contador: Arc::new(AtomicU64::new(0)),
        }
    }

    /// Carpeta donde se guardan los archivos subidos.
    pub fn archivos(&self) -> &PathBuf {
        &self.archivos
    }

    /// Base compartida, para el reconciliador y las pruebas.
    pub fn base(&self) -> Arc<Mutex<Db>> {
        Arc::clone(&self.db)
    }

    /// Puerto relacional en uso.
    pub fn relacional(&self) -> Arc<dyn Relacional> {
        Arc::clone(&self.relacional)
    }
}

/// Rutas del servicio.
pub fn router(estado: Estado) -> Router {
    Router::new()
        .route("/salud", get(salud))
        .route(
            "/contenidos/{tabla}/{id}",
            post(anclar).get(ver).delete(borrar),
        )
        .route(
            "/contenidos/{tabla}/{id}/adjuntos",
            post(adjuntar).patch(reordenar),
        )
        .route("/adjuntos/{oid}", delete(quitar_adjunto))
        .route("/clases/{clase}", get(por_clase))
        .route("/archivos", post(subir))
        .route("/archivos/{nombre}", get(servir))
        .route("/revisar", post(revisar))
        .route("/verificar", post(verificar))
        .route("/compactar", post(compactar))
        .with_state(estado)
}

struct Fallo(Error);

impl From<Error> for Fallo {
    fn from(error: Error) -> Self {
        Fallo(error)
    }
}

impl IntoResponse for Fallo {
    fn into_response(self) -> Response {
        let codigo = match &self.0 {
            Error::NoAutorizado => StatusCode::UNAUTHORIZED,
            Error::NoAnclado(_)
            | Error::SinArchivo(_)
            | Error::Objetos(oodb::Error::NoEncontrado(_)) => StatusCode::NOT_FOUND,
            Error::DemasiadoGrande(_) => StatusCode::PAYLOAD_TOO_LARGE,
            Error::Objetos(
                oodb::Error::NoCargado(_)
                | oodb::Error::SinObjetos(_)
                | oodb::Error::SinMigracion { .. },
            ) => StatusCode::SERVICE_UNAVAILABLE,
            Error::Objetos(
                oodb::Error::TieneReferencias { .. } | oodb::Error::ClaveDuplicada { .. },
            ) => StatusCode::CONFLICT,
            Error::Peticion(_)
            | Error::Objetos(
                oodb::Error::Invalido(_)
                | oodb::Error::TipoEquivocado { .. }
                | oodb::Error::FormatoDesconocido { .. },
            ) => StatusCode::BAD_REQUEST,
            _ => StatusCode::INTERNAL_SERVER_ERROR,
        };
        (codigo, Json(json!({ "error": self.0.to_string() }))).into_response()
    }
}

async fn con_db<T, F>(estado: &Estado, tarea: F) -> Resultado<T>
where
    T: Send + 'static,
    F: FnOnce(&mut Db) -> Resultado<T> + Send + 'static,
{
    let base = estado.base();
    tokio::task::spawn_blocking(move || {
        let mut db = base
            .lock()
            .map_err(|_| Error::Relacional("almacén bloqueado".into()))?;
        tarea(&mut db)
    })
    .await
    .map_err(|error| Error::Relacional(format!("tarea bloqueante: {error}")))?
}

fn exigir_token(estado: &Estado, cabeceras: &HeaderMap) -> Resultado<()> {
    let Some(esperado) = &estado.token else {
        return Ok(());
    };
    let recibido = cabeceras
        .get("authorization")
        .and_then(|valor| valor.to_str().ok())
        .unwrap_or_default();
    let recibido = recibido.strip_prefix("Bearer ").unwrap_or(recibido);
    if recibido == esperado {
        Ok(())
    } else {
        Err(Error::NoAutorizado)
    }
}

fn fila(tabla: &str, id: u64) -> Resultado<Ancla> {
    let tabla = tabla.parse::<Tabla>()?;
    Ok(Ancla::nueva(tabla, id)?)
}

fn oid_de(texto: &str) -> Resultado<Oid> {
    texto
        .parse::<Oid>()
        .map_err(|error| Error::Peticion(error.to_string()))
}

/// Vista JSON de un contenido con sus adjuntos, en el orden de las posiciones.
pub fn vista(db: &Db, oid: Oid) -> Resultado<Value> {
    let objeto = db.objeto(oid)?;
    let contenido = como_contenido(objeto)
        .ok_or_else(|| Error::Peticion(format!("{oid} no es un contenido")))?;
    let ancla = contenido.ancla().clone();
    let texto = objeto
        .as_any()
        .downcast_ref::<Publicacion>()
        .and_then(|publicacion| publicacion.texto().map(str::to_string))
        .or_else(|| {
            objeto
                .as_any()
                .downcast_ref::<Comentario>()
                .map(|comentario| comentario.texto().to_string())
        });
    let mut adjuntos: Vec<(u16, Value)> = contenido
        .adjuntos()
        .iter()
        .map(|referencia| {
            let oid = referencia.oid();
            match db.objeto(oid).ok().and_then(como_adjunto) {
                Some(adjunto) => (
                    adjunto.posicion(),
                    json!({
                        "oid": oid.valor(),
                        "tipo": adjunto.tipo().nombre(),
                        "url": adjunto.url(),
                        "posicion": adjunto.posicion(),
                        "duracion": adjunto.duracion(),
                    }),
                ),
                None => (
                    u16::MAX,
                    json!({ "oid": oid.valor(), "tipo": Value::Null, "url": Value::Null }),
                ),
            }
        })
        .collect();
    adjuntos.sort_by_key(|(posicion, _)| *posicion);
    let adjuntos: Vec<Value> = adjuntos.into_iter().map(|(_, valor)| valor).collect();
    Ok(json!({
        "oid": oid.valor(),
        "clase": objeto.clase(),
        "ancla": ancla.clave(),
        "tabla": ancla.tabla().nombre(),
        "registro_id": ancla.registro_id(),
        "texto": texto,
        "adjuntos": adjuntos,
    }))
}

async fn subir(
    State(estado): State<Estado>,
    cabeceras: HeaderMap,
    cuerpo: Bytes,
) -> Result<Json<Value>, Fallo> {
    if cuerpo.is_empty() {
        return Err(Fallo(Error::Peticion("el archivo está vacío".into())));
    }
    if cuerpo.len() > archivos::MAXIMO {
        return Err(Fallo(Error::DemasiadoGrande(archivos::MAXIMO)));
    }
    let tipo = cabeceras
        .get("content-type")
        .and_then(|valor| valor.to_str().ok())
        .unwrap_or_default()
        .split(';')
        .next()
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase();
    let extension = archivos::extension(&tipo).ok_or_else(|| {
        Fallo(Error::Peticion(format!(
            "tipo de archivo no admitido: «{tipo}»"
        )))
    })?;
    let contador = estado.contador.fetch_add(1, Ordering::Relaxed);
    let nombre = archivos::nombre_nuevo(extension, contador);
    let bytes = cuerpo.to_vec();
    let tamano = bytes.len();
    {
        let dir = Arc::clone(&estado.archivos);
        let nombre = nombre.clone();
        tokio::task::spawn_blocking(move || archivos::guardar(&dir, &nombre, &bytes))
            .await
            .map_err(|error| Fallo(Error::Relacional(format!("tarea bloqueante: {error}"))))??;
    }
    let relativa = format!("/archivos/{nombre}");
    Ok(Json(json!({
        "nombre": nombre,
        "url": absoluta(&estado, &cabeceras, &relativa),
        "ruta": relativa,
        "tipo": archivos::clase(&tipo),
        "mime": tipo,
        "bytes": tamano,
    })))
}

/// Convierte una ruta en URL absoluta con el host de la petición.
fn absoluta(estado: &Estado, cabeceras: &HeaderMap, ruta: &str) -> String {
    let esquema = cabeceras
        .get("x-forwarded-proto")
        .and_then(|valor| valor.to_str().ok())
        .unwrap_or("http");
    match cabeceras.get("host").and_then(|valor| valor.to_str().ok()) {
        Some(host) if !host.is_empty() => format!("{esquema}://{host}{ruta}"),
        _ => estado
            .publica
            .clone()
            .map(|base| format!("{}{ruta}", base.trim_end_matches('/')))
            .unwrap_or_else(|| ruta.to_string()),
    }
}

async fn servir(
    State(estado): State<Estado>,
    Path(nombre): Path<String>,
) -> Result<axum::response::Response, Fallo> {
    let extension = nombre.rsplit('.').next().unwrap_or_default().to_string();
    let tipo = archivos::tipo_de(&extension).unwrap_or("application/octet-stream");
    let dir = Arc::clone(&estado.archivos);
    let nombre_leido = nombre.clone();
    let bytes = tokio::task::spawn_blocking(move || archivos::leer(&dir, &nombre_leido))
        .await
        .map_err(|error| Fallo(Error::Relacional(format!("tarea bloqueante: {error}"))))??;
    Ok(([(axum::http::header::CONTENT_TYPE, tipo)], bytes).into_response())
}

async fn por_clase(
    State(estado): State<Estado>,
    Path(clase): Path<String>,
) -> Result<Json<Value>, Fallo> {
    let buscada = clase.clone();
    let filas = con_db(&estado, move |db| {
        let mut filas = Vec::new();
        for oid in db.por_clase(&buscada) {
            let objeto = db.objeto(oid)?;
            let (ancla, adjuntos) = match como_contenido(objeto) {
                Some(contenido) => (contenido.ancla().clave(), contenido.adjuntos().len()),
                None => (String::new(), 0),
            };
            filas.push(json!({
                "oid": oid.valor(),
                "clase": objeto.clase(),
                "ancla": ancla,
                "adjuntos": adjuntos,
            }));
        }
        Ok(filas)
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(json!({ "clase": clase, "objetos": filas })))
}

async fn salud(State(estado): State<Estado>) -> Result<Json<Value>, Fallo> {
    let resumen = con_db(&estado, |db| {
        Ok(json!({
            "objetos": db.total(),
            "sin_confirmar": db.sin_confirmar(),
            "anclas": db.claves_de(INDICE_ANCLA).len(),
            "aristas": db.total_aristas(),
            "clases": db.conteo_clases(),
            "ruta": db.ruta().display().to_string(),
            "tamano": db.tamano().unwrap_or(0),
        }))
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(resumen))
}

#[derive(Deserialize, Default)]
struct CuerpoAnclar {
    #[serde(default)]
    texto: Option<String>,
}

async fn anclar(
    State(estado): State<Estado>,
    Path((tabla, id)): Path<(String, u64)>,
    cuerpo: Bytes,
) -> Result<Json<Value>, Fallo> {
    let ancla = fila(&tabla, id).map_err(Fallo)?;
    let texto = if cuerpo.is_empty() {
        None
    } else {
        serde_json::from_slice::<CuerpoAnclar>(&cuerpo)
            .map_err(|error| Fallo(Error::Peticion(format!("cuerpo inválido: {error}"))))?
            .texto
    };
    let clave = ancla.clave();
    let (oid, creado) = con_db(&estado, move |db| {
        let (oid, creado) = revision::anclar(db, &ancla, texto)?;
        db.commit()?;
        Ok((oid, creado))
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(
        json!({ "oid": oid.valor(), "ancla": clave, "creado": creado }),
    ))
}

async fn ver(
    State(estado): State<Estado>,
    Path((tabla, id)): Path<(String, u64)>,
) -> Result<Json<Value>, Fallo> {
    let ancla = fila(&tabla, id).map_err(Fallo)?;
    let vista = con_db(&estado, move |db| {
        let oid = db
            .por_clave(INDICE_ANCLA, &ancla.clave())
            .ok_or_else(|| Error::NoAnclado(ancla.clave()))?;
        vista(db, oid)
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(vista))
}

async fn borrar(
    State(estado): State<Estado>,
    Path((tabla, id)): Path<(String, u64)>,
) -> Result<Json<Value>, Fallo> {
    let ancla = fila(&tabla, id).map_err(Fallo)?;
    let clave = ancla.clave();
    let (borrados, confirmados) = con_db(&estado, move |db| {
        let oid = db
            .por_clave(INDICE_ANCLA, &ancla.clave())
            .ok_or_else(|| Error::NoAnclado(ancla.clave()))?;
        let borrados = db.eliminar(oid)?;
        let informe = db.commit()?;
        Ok((borrados, informe.borrados))
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(
        json!({ "ancla": clave, "borrados": borrados, "confirmados": confirmados }),
    ))
}

#[derive(Deserialize)]
struct CuerpoAdjunto {
    tipo: String,
    url: String,
    #[serde(default = "posicion_uno")]
    posicion: u16,
    #[serde(default)]
    duracion: Option<u32>,
}

fn posicion_uno() -> u16 {
    1
}

async fn adjuntar(
    State(estado): State<Estado>,
    Path((tabla, id)): Path<(String, u64)>,
    Json(cuerpo): Json<CuerpoAdjunto>,
) -> Result<Json<Value>, Fallo> {
    let ancla = fila(&tabla, id).map_err(Fallo)?;
    let clave = ancla.clave();
    let oid = con_db(&estado, move |db| {
        let objeto: Box<dyn oodb::Objeto> = match cuerpo.tipo.to_uppercase().as_str() {
            "IMAGEN" => Box::new(Imagen::nueva(cuerpo.url, cuerpo.posicion)?),
            "VIDEO" => Box::new(Video::nuevo(
                cuerpo.url,
                cuerpo.posicion,
                cuerpo
                    .duracion
                    .ok_or_else(|| Error::Peticion("un vídeo necesita duración".into()))?,
            )?),
            otro => {
                return Err(Error::Peticion(format!(
                    "tipo de adjunto «{otro}» no válido"
                )));
            }
        };
        let oid = db.insertar(objeto)?;
        revision::adjuntar(db, &ancla, oid)?;
        db.commit()?;
        Ok(oid)
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(json!({ "oid": oid.valor(), "ancla": clave })))
}

#[derive(Deserialize)]
struct CambioPosicion {
    oid: u64,
    posicion: u16,
}

#[derive(Deserialize)]
struct CuerpoReordenar {
    adjuntos: Vec<CambioPosicion>,
}

async fn reordenar(
    State(estado): State<Estado>,
    Path((tabla, id)): Path<(String, u64)>,
    Json(cuerpo): Json<CuerpoReordenar>,
) -> Result<Json<Value>, Fallo> {
    let ancla = fila(&tabla, id).map_err(Fallo)?;
    let cambios = con_db(&estado, move |db| {
        for cambio in cuerpo.adjuntos {
            let oid = Oid::from_str(&cambio.oid.to_string())?;
            let objeto = db.objeto_mut(oid)?;
            let any = objeto.as_any_mut();
            if let Some(imagen) = any.downcast_mut::<Imagen>() {
                imagen.recolocar(cambio.posicion)?;
            } else if let Some(video) = any.downcast_mut::<Video>() {
                video.recolocar(cambio.posicion)?;
            } else {
                db.descartar()?;
                return Err(Error::Peticion(format!("{oid} no es un adjunto")));
            }
        }
        let oid = db
            .por_clave(INDICE_ANCLA, &ancla.clave())
            .ok_or_else(|| Error::NoAnclado(ancla.clave()))?;
        let mut vistas = std::collections::BTreeSet::new();
        let repetidas = {
            let objeto = db.objeto(oid)?;
            let contenido = como_contenido(objeto)
                .ok_or_else(|| Error::Peticion(format!("{oid} no es un contenido")))?;
            contenido.adjuntos().iter().any(|referencia| {
                let posicion = db
                    .objeto(referencia.oid())
                    .ok()
                    .and_then(como_adjunto)
                    .map_or(0, |adjunto| adjunto.posicion());
                !vistas.insert(posicion)
            })
        };
        if repetidas {
            db.descartar()?;
            return Err(Error::Peticion(
                "dos adjuntos no pueden compartir posición".to_string(),
            ));
        }
        db.commit()?;
        Ok(cuerpo_vacio(&ancla))
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(cambios))
}

fn cuerpo_vacio(ancla: &Ancla) -> Value {
    json!({ "ancla": ancla.clave(), "reordenado": true })
}

async fn quitar_adjunto(
    State(estado): State<Estado>,
    Path(oid): Path<String>,
) -> Result<Json<Value>, Fallo> {
    let oid = oid_de(&oid).map_err(Fallo)?;
    let informe = con_db(&estado, move |db| {
        let contenido = db
            .extent()
            .find_map(|(candidato, objeto)| {
                como_contenido(objeto)
                    .filter(|contenido| contenido.adjuntos().iter().any(|r| r.oid() == oid))
                    .map(|_| candidato)
            })
            .ok_or_else(|| Error::Peticion(format!("ningún contenido tiene el adjunto {oid}")))?;
        {
            let objeto = db.objeto_mut(contenido)?;
            if let Some(contenido) = como_contenido_mut(objeto) {
                contenido.separar(oid);
            }
        }
        db.eliminar(oid)?;
        Ok(db.commit()?)
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(json!({ "borrados": informe.borrados })))
}

async fn revisar(State(estado): State<Estado>, cabeceras: HeaderMap) -> Result<Json<Value>, Fallo> {
    exigir_token(&estado, &cabeceras).map_err(Fallo)?;
    let relacional = estado.relacional();
    let informe = con_db(&estado, move |db| {
        revision::revisar(db, relacional.as_ref())
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(json!(informe)))
}

async fn verificar(
    State(estado): State<Estado>,
    cabeceras: HeaderMap,
) -> Result<Json<Value>, Fallo> {
    exigir_token(&estado, &cabeceras).map_err(Fallo)?;
    let informe = con_db(&estado, |db| {
        let informe = db.verificar()?;
        Ok(json!({
            "revisados": informe.revisados,
            "colgadas": informe
                .colgadas
                .iter()
                .map(|(desde, hacia)| json!({ "desde": desde.valor(), "hacia": hacia.valor() }))
                .collect::<Vec<_>>(),
            "descuadres": informe
                .descuadres
                .iter()
                .map(|oid| oid.valor())
                .collect::<Vec<_>>(),
            "esta_bien": informe.esta_bien(),
        }))
    })
    .await
    .map_err(Fallo)?;
    Ok(Json(informe))
}

async fn compactar(
    State(estado): State<Estado>,
    cabeceras: HeaderMap,
) -> Result<Json<Value>, Fallo> {
    exigir_token(&estado, &cabeceras).map_err(Fallo)?;
    let compactado = con_db(&estado, |db| Ok(db.compactar()?))
        .await
        .map_err(Fallo)?;
    Ok(Json(json!({ "compactado": compactado })))
}

use std::str::FromStr;
