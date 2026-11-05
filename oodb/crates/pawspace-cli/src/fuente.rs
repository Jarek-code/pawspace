//! De dónde lee y escribe la CLI: el archivo local o el servicio HTTP.

use std::path::PathBuf;
use std::str::FromStr;

use oodb::{Db, Oid};
use pawspace_modelo::{
    Ancla, INDICE_ANCLA, Imagen, Tabla, Video, como_adjunto, como_contenido, como_contenido_mut,
};
use pawspace_servicio::{SinRelacional, revision};
use serde_json::{Value, json};

/// Error de la fuente, ya listo para mostrar.
pub type Resultado<T> = std::result::Result<T, String>;

/// Origen de datos de la CLI.
pub trait Fuente {
    /// Descripción corta del origen.
    fn descripcion(&self) -> String;
    /// Resumen del almacén.
    fn resumen(&mut self) -> Resultado<Value>;
    /// Contenidos de una clase.
    fn listar(&mut self, clase: &str) -> Resultado<Vec<Value>>;
    /// Contenido anclado con sus adjuntos.
    fn detalle(&mut self, tabla: &str, id: u64) -> Resultado<Value>;
    /// Ancla una fila; repetirlo no duplica.
    fn anclar(&mut self, tabla: &str, id: u64, texto: Option<String>) -> Resultado<Value>;
    /// Cuelga un archivo del contenido.
    fn adjuntar(
        &mut self,
        tabla: &str,
        id: u64,
        tipo: &str,
        url: &str,
        posicion: u16,
        duracion: Option<u32>,
    ) -> Resultado<Value>;
    /// Desengancha y borra un adjunto.
    fn quitar_adjunto(&mut self, oid: u64) -> Resultado<Value>;
    /// Cambia la posición de un adjunto.
    fn mover(&mut self, tabla: &str, id: u64, oid: u64, posicion: u16) -> Resultado<Value>;
    /// Borra el contenido y sus adjuntos.
    fn borrar(&mut self, tabla: &str, id: u64) -> Resultado<Value>;
    /// Reconcilia con la base relacional.
    fn revisar(&mut self) -> Resultado<Value>;
    /// Compacta el almacén.
    fn compactar(&mut self) -> Resultado<Value>;
    /// Comprueba los enlaces.
    fn verificar(&mut self) -> Resultado<Value>;
    /// Objetos en JSON crudo; sólo el modo archivo lo soporta.
    fn volcado(&mut self, clase: Option<&str>) -> Resultado<Value>;
    /// Sube un archivo del disco; sólo el servicio lo puede guardar.
    fn subir(&mut self, archivo: &std::path::Path) -> Resultado<Value>;
}

/// Aclaraciones para el mensaje de error cuando algo sólo existe en un modo.
fn solo_archivo(comando: &str) -> String {
    format!("«{comando}» sólo está disponible en modo archivo (sin --url)")
}

fn oid_de(valor: u64) -> Resultado<Oid> {
    Oid::from_str(&valor.to_string()).map_err(|error| error.to_string())
}

fn ancla(tabla: &str, id: u64) -> Resultado<Ancla> {
    let tabla = Tabla::from_str(tabla).map_err(|error| error.to_string())?;
    Ancla::nueva(tabla, id).map_err(|error| error.to_string())
}

fn clave_de(ancla: &Ancla) -> String {
    ancla.clave()
}

/// Almacén abierto en este proceso.
pub struct Local {
    db: Db,
    ruta: String,
}

impl Local {
    /// Abre el archivo del almacén.
    pub fn abrir(ruta: PathBuf) -> Resultado<Self> {
        let db = Db::abrir(&ruta).map_err(|error| error.to_string())?;
        Ok(Local {
            db,
            ruta: ruta.display().to_string(),
        })
    }

    fn posiciones(&self, contenido: Oid) -> Resultado<Vec<(Oid, u16)>> {
        let objeto = self
            .db
            .objeto(contenido)
            .map_err(|error| error.to_string())?;
        let adjuntos = como_contenido(objeto)
            .ok_or_else(|| format!("{contenido} no es un contenido"))?
            .adjuntos()
            .to_vec();
        Ok(adjuntos
            .iter()
            .map(|referencia| {
                let posicion = self
                    .db
                    .objeto(referencia.oid())
                    .ok()
                    .and_then(como_adjunto)
                    .map_or(0, |adjunto| adjunto.posicion());
                (referencia.oid(), posicion)
            })
            .collect())
    }

    fn contenido(&self, ancla: &Ancla) -> Resultado<Oid> {
        self.db
            .por_clave(INDICE_ANCLA, &clave_de(ancla))
            .ok_or_else(|| format!("no hay contenido anclado a {ancla}"))
    }
}

impl Fuente for Local {
    fn descripcion(&self) -> String {
        format!("archivo {}", self.ruta)
    }

    fn resumen(&mut self) -> Resultado<Value> {
        Ok(json!({
            "origen": self.descripcion(),
            "objetos": self.db.total(),
            "anclas": self.db.claves_de(INDICE_ANCLA).len(),
            "aristas": self.db.total_aristas(),
            "sin_confirmar": self.db.sin_confirmar(),
            "tamano": self.db.tamano().map_err(|error| error.to_string())?,
            "clases": self.db.conteo_clases(),
        }))
    }

    fn listar(&mut self, clase: &str) -> Resultado<Vec<Value>> {
        let mut filas = Vec::new();
        for oid in self.db.por_clase(clase) {
            let Ok(objeto) = self.db.objeto(oid) else {
                continue;
            };
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
    }

    fn detalle(&mut self, tabla: &str, id: u64) -> Resultado<Value> {
        let ancla = ancla(tabla, id)?;
        let oid = self.contenido(&ancla)?;
        pawspace_servicio::api::vista(&self.db, oid).map_err(|error| error.to_string())
    }

    fn anclar(&mut self, tabla: &str, id: u64, texto: Option<String>) -> Resultado<Value> {
        let ancla = ancla(tabla, id)?;
        let (oid, creado) =
            revision::anclar(&mut self.db, &ancla, texto).map_err(|error| error.to_string())?;
        self.db.commit().map_err(|error| error.to_string())?;
        Ok(json!({ "oid": oid.valor(), "ancla": clave_de(&ancla), "creado": creado }))
    }

    fn adjuntar(
        &mut self,
        tabla: &str,
        id: u64,
        tipo: &str,
        url: &str,
        posicion: u16,
        duracion: Option<u32>,
    ) -> Resultado<Value> {
        let ancla = ancla(tabla, id)?;
        let objeto: Box<dyn oodb::Objeto> = match tipo {
            "VIDEO" => Box::new(
                Video::nuevo(url, posicion, duracion.unwrap_or(1))
                    .map_err(|error| error.to_string())?,
            ),
            _ => Box::new(Imagen::nueva(url, posicion).map_err(|error| error.to_string())?),
        };
        let oid = self
            .db
            .insertar(objeto)
            .map_err(|error| error.to_string())?;
        revision::adjuntar(&mut self.db, &ancla, oid).map_err(|error| {
            let _ = self.db.descartar();
            error.to_string()
        })?;
        self.db.commit().map_err(|error| error.to_string())?;
        Ok(json!({ "oid": oid.valor(), "ancla": clave_de(&ancla), "tipo": tipo }))
    }

    fn quitar_adjunto(&mut self, oid: u64) -> Resultado<Value> {
        let oid = oid_de(oid)?;
        let contenido = self
            .db
            .extent()
            .find_map(|(candidato, objeto)| {
                como_contenido(objeto)
                    .filter(|contenido| contenido.adjuntos().iter().any(|r| r.oid() == oid))
                    .map(|_| candidato)
            })
            .ok_or_else(|| format!("ningún contenido tiene el adjunto {oid}"))?;
        {
            let objeto = self
                .db
                .objeto_mut(contenido)
                .map_err(|error| error.to_string())?;
            if let Some(contenido) = como_contenido_mut(objeto) {
                contenido.separar(oid);
            }
        }
        self.db.eliminar(oid).map_err(|error| error.to_string())?;
        self.db.commit().map_err(|error| error.to_string())?;
        Ok(json!({ "quitar": oid.valor() }))
    }

    fn mover(&mut self, tabla: &str, id: u64, oid: u64, posicion: u16) -> Resultado<Value> {
        let ancla = ancla(tabla, id)?;
        let contenido = self.contenido(&ancla)?;
        let oid = oid_de(oid)?;
        let ocupadas = self.posiciones(contenido)?;
        let anterior = ocupadas
            .iter()
            .find(|(otro, _)| *otro == oid)
            .map(|(_, posicion)| *posicion)
            .ok_or_else(|| format!("el adjunto {oid} no cuelga de {ancla}"))?;
        let ocupante = ocupadas
            .iter()
            .find(|(otro, actual)| *actual == posicion && *otro != oid)
            .map(|(otro, _)| *otro);
        recolocar(&mut self.db, oid, posicion)?;
        if let Some(ocupante) = ocupante {
            recolocar(&mut self.db, ocupante, anterior)?;
        }
        self.db.commit().map_err(|error| error.to_string())?;
        Ok(json!({
            "oid": oid.valor(),
            "posicion": posicion,
            "intercambiado_con": ocupante.map(|otro| otro.valor()),
        }))
    }

    fn borrar(&mut self, tabla: &str, id: u64) -> Resultado<Value> {
        let ancla = ancla(tabla, id)?;
        let oid = self.contenido(&ancla)?;
        let borrados = self.db.eliminar(oid).map_err(|error| error.to_string())?;
        let informe = self.db.commit().map_err(|error| error.to_string())?;
        Ok(
            json!({ "ancla": clave_de(&ancla), "borrados": borrados, "confirmados": informe.borrados }),
        )
    }

    fn revisar(&mut self) -> Resultado<Value> {
        let informe =
            revision::revisar(&mut self.db, &SinRelacional).map_err(|error| error.to_string())?;
        Ok(json!(informe))
    }

    fn compactar(&mut self) -> Resultado<Value> {
        let compactado = self.db.compactar().map_err(|error| error.to_string())?;
        Ok(json!({ "compactado": compactado }))
    }

    fn verificar(&mut self) -> Resultado<Value> {
        let informe = self.db.verificar().map_err(|error| error.to_string())?;
        Ok(json!({
            "revisados": informe.revisados,
            "colgadas": informe
                .colgadas
                .iter()
                .map(|(desde, hacia)| json!({ "desde": desde.valor(), "hacia": hacia.valor() }))
                .collect::<Vec<_>>(),
            "descuadres": informe.descuadres.iter().map(|oid| oid.valor()).collect::<Vec<_>>(),
            "esta_bien": informe.esta_bien(),
        }))
    }

    fn subir(&mut self, _archivo: &std::path::Path) -> Resultado<Value> {
        Err("«subir» necesita el servicio (--url): el archivo lo guarda él".to_string())
    }

    fn volcado(&mut self, clase: Option<&str>) -> Resultado<Value> {
        let permitidos: Option<Vec<u64>> = clase.map(|clase| {
            self.db
                .por_clase(clase)
                .iter()
                .map(|oid| oid.valor())
                .collect()
        });
        let mut objetos = Vec::new();
        for (oid, texto) in self.db.volcado().map_err(|error| error.to_string())? {
            if permitidos
                .as_ref()
                .is_some_and(|lista| !lista.contains(&oid.valor()))
            {
                continue;
            }
            objetos.push(serde_json::from_str::<Value>(&texto).unwrap_or(Value::Null));
        }
        Ok(json!({ "objetos": objetos }))
    }
}

/// Servicio HTTP de la OODB.
pub struct Remoto {
    base: String,
    token: Option<String>,
}

impl Remoto {
    /// Cliente contra la URL del servicio.
    pub fn nuevo(base: String, token: Option<String>) -> Self {
        Remoto {
            base: base.trim_end_matches('/').to_string(),
            token,
        }
    }

    fn pedir(&self, metodo: &str, ruta: &str, cuerpo: Option<Value>) -> Resultado<Value> {
        let url = format!("{}{}", self.base, ruta);
        let mut peticion = match metodo {
            "GET" => ureq::get(&url),
            "PATCH" => ureq::patch(&url),
            "DELETE" => ureq::delete(&url),
            _ => ureq::post(&url),
        };
        if let Some(token) = &self.token {
            peticion = peticion.set("Authorization", &format!("Bearer {token}"));
        }
        let respuesta = match cuerpo {
            Some(cuerpo) => peticion.send_json(cuerpo),
            None => peticion.call(),
        };
        match respuesta {
            Ok(respuesta) => respuesta
                .into_json::<Value>()
                .map_err(|error| error.to_string()),
            Err(ureq::Error::Status(_, respuesta)) => {
                let valor: Value = respuesta.into_json().unwrap_or(Value::Null);
                Err(valor
                    .get("error")
                    .and_then(Value::as_str)
                    .unwrap_or("el servicio devolvió un error")
                    .to_string())
            }
            Err(error) => Err(format!("no se pudo contactar al servicio: {error}")),
        }
    }
}

impl Fuente for Remoto {
    fn descripcion(&self) -> String {
        format!("servicio {}", self.base)
    }

    fn resumen(&mut self) -> Resultado<Value> {
        self.pedir("GET", "/salud", None)
    }

    fn listar(&mut self, clase: &str) -> Resultado<Vec<Value>> {
        let respuesta = self.pedir("GET", &format!("/clases/{clase}"), None)?;
        Ok(respuesta
            .get("objetos")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default())
    }

    fn detalle(&mut self, tabla: &str, id: u64) -> Resultado<Value> {
        self.pedir("GET", &format!("/contenidos/{tabla}/{id}"), None)
    }

    fn anclar(&mut self, tabla: &str, id: u64, texto: Option<String>) -> Resultado<Value> {
        self.pedir(
            "POST",
            &format!("/contenidos/{tabla}/{id}"),
            Some(json!({ "texto": texto })),
        )
    }

    fn adjuntar(
        &mut self,
        tabla: &str,
        id: u64,
        tipo: &str,
        url: &str,
        posicion: u16,
        duracion: Option<u32>,
    ) -> Resultado<Value> {
        let cuerpo = json!({
            "tipo": tipo,
            "url": url,
            "posicion": posicion,
            "duracion": duracion,
        });
        self.pedir(
            "POST",
            &format!("/contenidos/{tabla}/{id}/adjuntos"),
            Some(cuerpo),
        )
    }

    fn quitar_adjunto(&mut self, oid: u64) -> Resultado<Value> {
        self.pedir("DELETE", &format!("/adjuntos/{oid}"), None)
    }

    fn mover(&mut self, tabla: &str, id: u64, oid: u64, posicion: u16) -> Resultado<Value> {
        let detalle = self.detalle(tabla, id)?;
        let adjuntos = detalle
            .get("adjuntos")
            .and_then(Value::as_array)
            .cloned()
            .unwrap_or_default();
        let mut cambios: Vec<Value> = Vec::new();
        let mut anterior = None;
        let mut ocupante = None;
        for adjunto in &adjuntos {
            let (Some(actual), Some(otro)) = (numero(adjunto, "oid"), numero(adjunto, "posicion"))
            else {
                continue;
            };
            if actual == oid {
                anterior = Some(otro);
            }
            if otro == u64::from(posicion) && actual != oid {
                ocupante = Some(actual);
            }
        }
        let anterior =
            anterior.ok_or_else(|| format!("el adjunto #{oid} no cuelga de {tabla}:{id}"))?;
        cambios.push(json!({ "oid": oid, "posicion": posicion }));
        if let Some(ocupante) = ocupante {
            cambios.push(json!({ "oid": ocupante, "posicion": anterior }));
        }
        self.pedir(
            "PATCH",
            &format!("/contenidos/{tabla}/{id}/adjuntos"),
            Some(json!({ "adjuntos": cambios })),
        )
    }

    fn borrar(&mut self, tabla: &str, id: u64) -> Resultado<Value> {
        self.pedir("DELETE", &format!("/contenidos/{tabla}/{id}"), None)
    }

    fn revisar(&mut self) -> Resultado<Value> {
        self.pedir("POST", "/revisar", None)
    }

    fn compactar(&mut self) -> Resultado<Value> {
        self.pedir("POST", "/compactar", None)
    }

    fn verificar(&mut self) -> Resultado<Value> {
        self.pedir("POST", "/verificar", None)
    }

    fn volcado(&mut self, _clase: Option<&str>) -> Resultado<Value> {
        Err(solo_archivo("volcar"))
    }

    fn subir(&mut self, archivo: &std::path::Path) -> Resultado<Value> {
        let bytes = std::fs::read(archivo)
            .map_err(|error| format!("no se pudo leer {}: {error}", archivo.display()))?;
        if bytes.is_empty() {
            return Err(format!("{} está vacío", archivo.display()));
        }
        let extension = archivo
            .extension()
            .and_then(|extension| extension.to_str())
            .map(str::to_ascii_lowercase)
            .ok_or_else(|| "el archivo no tiene extensión".to_string())?;
        let tipo = pawspace_servicio::archivos::tipo_de(&extension).ok_or_else(|| {
            format!("extensión no admitida «{extension}»: jpg, png, webp, gif, mp4 o webm")
        })?;
        let url = format!("{}/archivos", self.base);
        let mut peticion = ureq::post(&url).set("content-type", tipo);
        if let Some(token) = &self.token {
            peticion = peticion.set("Authorization", &format!("Bearer {token}"));
        }
        match peticion.send_bytes(&bytes) {
            Ok(respuesta) => respuesta
                .into_json::<Value>()
                .map_err(|error| error.to_string()),
            Err(ureq::Error::Status(_, respuesta)) => {
                let valor: Value = respuesta.into_json().unwrap_or(Value::Null);
                Err(valor
                    .get("error")
                    .and_then(Value::as_str)
                    .unwrap_or("el servicio rechazó el archivo")
                    .to_string())
            }
            Err(error) => Err(format!("no se pudo contactar al servicio: {error}")),
        }
    }
}

fn recolocar(db: &mut Db, oid: Oid, posicion: u16) -> Resultado<()> {
    let objeto = db.objeto_mut(oid).map_err(|error| error.to_string())?;
    let any = objeto.as_any_mut();
    if let Some(imagen) = any.downcast_mut::<Imagen>() {
        imagen
            .recolocar(posicion)
            .map_err(|error| error.to_string())
    } else if let Some(video) = any.downcast_mut::<Video>() {
        video.recolocar(posicion).map_err(|error| error.to_string())
    } else {
        Err(format!("{oid} no es un adjunto"))
    }
}

/// Marca de los adjuntos que devuelve el servicio.
pub fn tipo_de(adjunto: &Value) -> String {
    adjunto
        .get("tipo")
        .and_then(Value::as_str)
        .unwrap_or("-")
        .to_string()
}

/// URL de un adjunto devuelto por el servicio.
pub fn url_de(adjunto: &Value) -> String {
    adjunto
        .get("url")
        .and_then(Value::as_str)
        .unwrap_or("-")
        .to_string()
}

/// Extrae un número de un JSON.
pub fn numero(valor: &Value, campo: &str) -> Option<u64> {
    valor.get(campo).and_then(Value::as_u64)
}

/// Extrae un texto de un JSON.
pub fn texto_de(valor: &Value, campo: &str) -> Option<String> {
    valor.get(campo).and_then(Value::as_str).map(str::to_string)
}
