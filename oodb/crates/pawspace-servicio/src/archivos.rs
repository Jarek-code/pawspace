//! Guardado de los archivos subidos en una carpeta del disco.
//!
//! Es el almacén provisional: el servicio escribe el binario y devuelve la ruta con la que se
//! puede pedir después. Cuando haya un almacén de objetos, sólo cambia este módulo.

use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::error::{Error, Resultado};

/// Tamaño máximo aceptado de un archivo.
pub const MAXIMO: usize = 25 * 1024 * 1024;

/// Extensión con la que se guarda cada tipo admitido.
pub fn extension(tipo: &str) -> Option<&'static str> {
    match tipo {
        "image/jpeg" => Some("jpg"),
        "image/png" => Some("png"),
        "image/webp" => Some("webp"),
        "image/gif" => Some("gif"),
        "video/mp4" => Some("mp4"),
        "video/webm" => Some("webm"),
        _ => None,
    }
}

/// Tipo con el que se sirve cada extensión.
pub fn tipo_de(extension: &str) -> Option<&'static str> {
    match extension {
        "jpg" | "jpeg" => Some("image/jpeg"),
        "png" => Some("image/png"),
        "webp" => Some("image/webp"),
        "gif" => Some("image/gif"),
        "mp4" => Some("video/mp4"),
        "webm" => Some("video/webm"),
        _ => None,
    }
}

/// `IMAGEN` o `VIDEO`, según el tipo del archivo.
pub fn clase(tipo: &str) -> &'static str {
    if tipo.starts_with("video/") {
        "VIDEO"
    } else {
        "IMAGEN"
    }
}

/// Nombre único y sin datos del usuario: milisegundos, contador y extensión.
pub fn nombre_nuevo(extension: &str, contador: u64) -> String {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duracion| duracion.as_millis())
        .unwrap_or(0);
    format!("{millis:x}-{contador:04x}.{extension}")
}

/// Nombre válido: sólo lo que genera el servicio.
pub fn validar_nombre(nombre: &str) -> Resultado<()> {
    let limpio = !nombre.is_empty()
        && nombre.len() <= 80
        && nombre.chars().all(|caracter| {
            caracter.is_ascii_alphanumeric() || matches!(caracter, '-' | '.' | '_')
        })
        && !nombre.contains("..");
    if limpio {
        Ok(())
    } else {
        Err(Error::Peticion(format!(
            "nombre de archivo inválido: «{nombre}»"
        )))
    }
}

/// Escribe el archivo y devuelve su ruta completa.
pub fn guardar(dir: &Path, nombre: &str, bytes: &[u8]) -> Resultado<PathBuf> {
    fs::create_dir_all(dir)?;
    let ruta = dir.join(nombre);
    fs::write(&ruta, bytes)?;
    Ok(ruta)
}

/// Lee un archivo guardado.
pub fn leer(dir: &Path, nombre: &str) -> Resultado<Vec<u8>> {
    validar_nombre(nombre)?;
    let ruta = dir.join(nombre);
    fs::read(&ruta).map_err(|error| {
        if error.kind() == std::io::ErrorKind::NotFound {
            Error::SinArchivo(nombre.to_string())
        } else {
            Error::Io(error)
        }
    })
}
