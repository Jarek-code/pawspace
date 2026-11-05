//! Los archivos multimedia que cuelgan de un contenido.

use std::fmt;
use std::str::FromStr;

use oodb::error::Resultado;
use oodb::{Error, Objeto, Oid};
use serde::{Deserialize, Serialize};

/// Largo máximo de una URL de archivo, como la columna `archivo_url`.
pub const URL_MAXIMA: usize = 2048;
/// Duración máxima aceptada de un vídeo, en segundos.
pub const DURACION_MAXIMA: u32 = 3600;

/// Tipo de adjunto, igual que el `ENUM('IMAGEN','VIDEO')` del esquema.
#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum TipoAdjunto {
    /// Imagen.
    Imagen,
    /// Vídeo.
    Video,
}

impl TipoAdjunto {
    /// Nombre del tipo en el esquema.
    pub fn nombre(self) -> &'static str {
        match self {
            TipoAdjunto::Imagen => "IMAGEN",
            TipoAdjunto::Video => "VIDEO",
        }
    }
}

impl fmt::Display for TipoAdjunto {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.nombre())
    }
}

impl FromStr for TipoAdjunto {
    type Err = Error;

    fn from_str(texto: &str) -> Resultado<Self> {
        match texto.trim().to_ascii_uppercase().as_str() {
            "IMAGEN" => Ok(TipoAdjunto::Imagen),
            "VIDEO" => Ok(TipoAdjunto::Video),
            _ => Err(Error::Invalido(format!(
                "tipo de adjunto desconocido «{texto}»"
            ))),
        }
    }
}

/// Archivo multimedia enlazado desde un contenido.
pub trait Adjunto: Objeto {
    /// URL del archivo.
    fn url(&self) -> &str;

    /// Posición dentro del contenido, desde 1.
    fn posicion(&self) -> u16;

    /// Imagen o vídeo.
    fn tipo(&self) -> TipoAdjunto {
        TipoAdjunto::Imagen
    }

    /// Duración en segundos, sólo en vídeos.
    fn duracion(&self) -> Option<u32> {
        None
    }

    /// Vista como este trait, para no depender del `downcast` en cada llamada.
    fn como_adjunto(&self) -> &dyn Adjunto
    where
        Self: Sized,
    {
        self
    }
}

/// Baja un objeto a la familia de los adjuntos.
pub fn como_adjunto(objeto: &dyn Objeto) -> Option<&dyn Adjunto> {
    let any = objeto.as_any();
    if let Some(imagen) = any.downcast_ref::<Imagen>() {
        Some(imagen)
    } else {
        any.downcast_ref::<Video>()
            .map(|video| video as &dyn Adjunto)
    }
}

fn validar_url(url: &str) -> Resultado<()> {
    let limpia = url.trim();
    if limpia.is_empty() {
        return Err(Error::Invalido("la URL del adjunto está vacía".into()));
    }
    if limpia.len() > URL_MAXIMA {
        return Err(Error::Invalido(format!(
            "la URL del adjunto supera {URL_MAXIMA} caracteres"
        )));
    }
    if !(limpia.starts_with("http://") || limpia.starts_with("https://")) {
        return Err(Error::Invalido(format!(
            "la URL del adjunto debe empezar por http:// o https://: «{limpia}»"
        )));
    }
    Ok(())
}

fn validar_posicion(posicion: u16) -> Resultado<()> {
    if posicion == 0 {
        return Err(Error::Invalido(
            "la posición del adjunto empieza en 1".into(),
        ));
    }
    Ok(())
}

/// Imagen adjunta a un contenido.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Imagen {
    url: String,
    posicion: u16,
}

impl Imagen {
    /// Crea una imagen validando la URL y la posición.
    pub fn nueva(url: impl Into<String>, posicion: u16) -> Resultado<Self> {
        let url = url.into();
        validar_url(&url)?;
        validar_posicion(posicion)?;
        Ok(Imagen {
            url: url.trim().to_string(),
            posicion,
        })
    }

    /// Cambia la posición dentro del contenido.
    pub fn recolocar(&mut self, posicion: u16) -> Resultado<()> {
        validar_posicion(posicion)?;
        self.posicion = posicion;
        Ok(())
    }
}

#[typetag::serde]
impl Objeto for Imagen {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
        self
    }
    fn clase(&self) -> &'static str {
        "Imagen"
    }
}

impl Adjunto for Imagen {
    fn url(&self) -> &str {
        &self.url
    }
    fn posicion(&self) -> u16 {
        self.posicion
    }
}

/// Vídeo adjunto a un contenido.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct Video {
    url: String,
    posicion: u16,
    duracion_seg: u32,
}

impl Video {
    /// Crea un vídeo validando la URL, la posición y la duración.
    pub fn nuevo(url: impl Into<String>, posicion: u16, duracion_seg: u32) -> Resultado<Self> {
        let url = url.into();
        validar_url(&url)?;
        validar_posicion(posicion)?;
        if duracion_seg == 0 || duracion_seg > DURACION_MAXIMA {
            return Err(Error::Invalido(format!(
                "la duración del vídeo debe estar entre 1 y {DURACION_MAXIMA} segundos"
            )));
        }
        Ok(Video {
            url: url.trim().to_string(),
            posicion,
            duracion_seg,
        })
    }

    /// Cambia la posición dentro del contenido.
    pub fn recolocar(&mut self, posicion: u16) -> Resultado<()> {
        validar_posicion(posicion)?;
        self.posicion = posicion;
        Ok(())
    }
}

#[typetag::serde]
impl Objeto for Video {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
        self
    }
    fn clase(&self) -> &'static str {
        "Video"
    }
}

impl Adjunto for Video {
    fn url(&self) -> &str {
        &self.url
    }
    fn posicion(&self) -> u16 {
        self.posicion
    }
    fn tipo(&self) -> TipoAdjunto {
        TipoAdjunto::Video
    }
    fn duracion(&self) -> Option<u32> {
        Some(self.duracion_seg)
    }
}

/// OID de un adjunto, para enlazarlo desde un contenido.
pub type RefAdjunto = oodb::Referencia<dyn Adjunto>;

/// Adjunto enlazado por su OID.
pub fn referencia(oid: Oid) -> RefAdjunto {
    oodb::Referencia::nueva(oid)
}
