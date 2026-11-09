//! Configuración por entorno.

use std::path::PathBuf;

use crate::error::{Error, Resultado};

/// Ajustes del proceso.
#[derive(Clone, Debug)]
pub struct Config {
    /// Dirección donde escucha la API.
    pub host: String,
    /// Puerto de la API.
    pub puerto: u16,
    /// Archivo del almacén de objetos.
    pub ruta: PathBuf,
    /// Carpeta donde se guardan los archivos subidos.
    pub archivos: PathBuf,
    /// Base pública con la que se anuncian los archivos si la petición no trae `Host`.
    pub publica: Option<String>,
    /// URL de MariaDB; si falta, el servicio arranca sin base relacional.
    pub base: Option<String>,
    /// Token exigido por las rutas de administración.
    pub token: Option<String>,
    /// Cada cuántos segundos pasa el reconciliador; 0 lo desactiva.
    pub intervalo: u64,
}

impl Config {
    /// Lee la configuración de las variables de entorno.
    pub fn desde_entorno() -> Resultado<Self> {
        let ruta = std::env::var("OODB_RUTA").unwrap_or_else(|_| "datos/pawspace.redb".to_string());
        let puerto = std::env::var("OODB_PUERTO")
            .unwrap_or_else(|_| "8787".to_string())
            .parse::<u16>()
            .map_err(|_| Error::Configuracion("OODB_PUERTO no es un puerto".into()))?;
        let intervalo = std::env::var("OODB_INTERVALO_SEG")
            .unwrap_or_else(|_| "30".to_string())
            .parse::<u64>()
            .map_err(|_| Error::Configuracion("OODB_INTERVALO_SEG no es un número".into()))?;
        Ok(Config {
            host: std::env::var("OODB_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            puerto,
            ruta: PathBuf::from(ruta),
            archivos: PathBuf::from(
                std::env::var("OODB_ARCHIVOS").unwrap_or_else(|_| "datos/archivos".to_string()),
            ),
            publica: std::env::var("OODB_URL_PUBLICA")
                .ok()
                .filter(|base| !base.is_empty()),
            base: std::env::var("OODB_BASE")
                .ok()
                .filter(|url| !url.is_empty()),
            token: std::env::var("OODB_TOKEN").ok().filter(|t| !t.is_empty()),
            intervalo,
        })
    }
}
