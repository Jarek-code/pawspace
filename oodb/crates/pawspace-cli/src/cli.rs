//! Comandos de la CLI y su ejecución.

use std::io::Write;
use std::path::PathBuf;

use clap::{Parser, Subcommand};
use pawspace_modelo::Tabla;
use serde_json::Value;

use crate::fuente::{Fuente, Local, Remoto, numero, texto_de, tipo_de, url_de};
use crate::salida;

const AYUDA: &str = "\
Ejemplos:
  pawspace-oodb anclar PUBLICACION 1207 --texto \"en el parque\"
  pawspace-oodb adjuntar PUBLICACION 1207 --imagen https://cdn/parque.jpg
  pawspace-oodb adjuntar PUBLICACION 1207 --video https://cdn/paseo.mp4 --duracion 42
  pawspace-oodb ver PUBLICACION 1207
  pawspace-oodb listar --clase Publicacion
  pawspace-oodb borrar PUBLICACION 1207 --si

Sin --url trabaja contra el archivo del almacén; con --url, contra el servicio.
Las variables OODB_RUTA, OODB_URL y OODB_TOKEN hacen de valor por omisión.";

/// Adjuntos de PawSpace en la base de datos orientada a objetos.
#[derive(Parser)]
#[command(name = "pawspace-oodb", version, about, after_help = AYUDA)]
pub struct Args {
    /// Archivo del almacén (modo local).
    #[arg(long, value_name = "ARCHIVO", env = "OODB_RUTA", global = true)]
    pub ruta: Option<PathBuf>,

    /// URL del servicio (modo HTTP).
    #[arg(long, value_name = "URL", env = "OODB_URL", global = true)]
    pub url: Option<String>,

    /// Token de administración del servicio.
    #[arg(long, value_name = "TOKEN", env = "OODB_TOKEN", global = true)]
    pub token: Option<String>,

    /// Salida JSON, para scripts.
    #[arg(long, global = true)]
    pub json: bool,

    #[command(subcommand)]
    pub comando: Comando,
}

/// Qué hacer.
#[derive(Subcommand)]
pub enum Comando {
    /// Resumen del almacén: objetos, anclas y clases.
    Estado,

    /// Ancla una fila; repetirlo no duplica nada.
    Anclar {
        /// Tabla del esquema.
        tabla: String,
        /// Clave de la fila anclada.
        id: u64,
        /// Texto del contenido, si la tabla lo lleva.
        #[arg(long)]
        texto: Option<String>,
    },

    /// Muestra el contenido anclado y sus adjuntos.
    Ver {
        /// Tabla del esquema.
        tabla: String,
        /// Clave de la fila anclada.
        id: u64,
    },

    /// Lista los contenidos anclados.
    Listar {
        /// Clase a listar: Publicacion, Historia o Comentario.
        #[arg(long)]
        clase: Option<String>,
        /// Cuántos mostrar como máximo.
        #[arg(long, default_value_t = 50)]
        limite: usize,
    },

    /// Cuelga una imagen o un vídeo del contenido.
    #[command(group(clap::ArgGroup::new("archivo").required(true)))]
    Adjuntar {
        /// Tabla del esquema.
        tabla: String,
        /// Clave de la fila anclada.
        id: u64,
        /// URL de la imagen.
        #[arg(long, group = "archivo")]
        imagen: Option<String>,
        /// URL del vídeo.
        #[arg(long, group = "archivo")]
        video: Option<String>,
        /// Duración del vídeo, en segundos.
        #[arg(long, value_name = "SEGUNDOS")]
        duracion: Option<u32>,
        /// Posición dentro del contenido (desde 1).
        #[arg(long, default_value_t = 1)]
        posicion: u16,
    },

    /// Quita un adjunto y lo borra.
    Quitar {
        /// OID del adjunto.
        oid: u64,
    },

    /// Cambia la posición de un adjunto dentro de su contenido.
    Mover {
        /// Tabla del esquema.
        tabla: String,
        /// Clave de la fila anclada.
        id: u64,
        /// OID del adjunto.
        oid: u64,
        /// Posición nueva (desde 1).
        posicion: u16,
    },

    /// Borra el contenido y, en cascada, sus adjuntos.
    Borrar {
        /// Tabla del esquema.
        tabla: String,
        /// Clave de la fila anclada.
        id: u64,
        /// No pide confirmación.
        #[arg(long)]
        si: bool,
    },

    /// Reconcilia con MariaDB: borra lo eliminado, lo vencido y lo huérfano.
    Revisar,

    /// Compacta el archivo del almacén.
    Compactar,

    /// Comprueba los enlaces entre objetos.
    Verificar,

    /// Sube un archivo al servicio y, si se indica, lo cuelga del contenido.
    Subir {
        /// Archivo del disco (jpg, png, webp, gif, mp4 o webm).
        archivo: PathBuf,
        /// Tabla del esquema, para colgarlo además.
        #[arg(long)]
        tabla: Option<String>,
        /// Clave de la fila anclada.
        #[arg(long)]
        id: Option<u64>,
        /// Posición dentro del contenido.
        #[arg(long, default_value_t = 1)]
        posicion: u16,
        /// Duración del vídeo, en segundos.
        #[arg(long, value_name = "SEGUNDOS")]
        duracion: Option<u32>,
    },

    /// Vuelca los objetos en JSON (sólo modo archivo).
    Volcar {
        /// Clase a volcar.
        #[arg(long)]
        clase: Option<String>,
    },
}

/// Ejecuta el comando pedido.
pub fn ejecutar(args: Args) -> Result<(), String> {
    let mut fuente: Box<dyn Fuente> = match &args.url {
        Some(url) => Box::new(Remoto::nuevo(url.clone(), args.token.clone())),
        None => Box::new(Local::abrir(
            args.ruta
                .clone()
                .unwrap_or_else(|| PathBuf::from("datos/pawspace.redb")),
        )?),
    };
    let json = args.json;

    match args.comando {
        Comando::Estado => estado(fuente.as_mut(), json),
        Comando::Anclar { tabla, id, texto } => anclar(fuente.as_mut(), &tabla, id, texto, json),
        Comando::Ver { tabla, id } => ver(fuente.as_mut(), &tabla, id, json),
        Comando::Listar { clase, limite } => listar(fuente.as_mut(), clase, limite, json),
        Comando::Adjuntar {
            tabla,
            id,
            imagen,
            video,
            duracion,
            posicion,
        } => adjuntar(
            fuente.as_mut(),
            &tabla,
            id,
            imagen,
            video,
            duracion,
            posicion,
            json,
        ),
        Comando::Quitar { oid } => quitar(fuente.as_mut(), oid, json),
        Comando::Mover {
            tabla,
            id,
            oid,
            posicion,
        } => mover(fuente.as_mut(), &tabla, id, oid, posicion, json),
        Comando::Borrar { tabla, id, si } => borrar(fuente.as_mut(), &tabla, id, si, json),
        Comando::Revisar => informe(fuente.as_mut().revisar(), json, |valor| {
            format!(
                "revisadas {} anclas · {} borrados · {} pendientes aplicados{}",
                numero(valor, "revisadas").unwrap_or(0),
                numero(valor, "borrados").unwrap_or(0),
                numero(valor, "aplicadas").unwrap_or(0),
                avisos(valor),
            )
        }),
        Comando::Compactar => informe(fuente.as_mut().compactar(), json, |valor| {
            if valor
                .get("compactado")
                .and_then(Value::as_bool)
                .unwrap_or(false)
            {
                "almacén compactado".to_string()
            } else {
                "no había nada que compactar".to_string()
            }
        }),
        Comando::Verificar => informe(fuente.as_mut().verificar(), json, |valor| {
            let colgadas = valor
                .get("colgadas")
                .and_then(Value::as_array)
                .map_or(0, Vec::len);
            let descuadres = valor
                .get("descuadres")
                .and_then(Value::as_array)
                .map_or(0, Vec::len);
            format!(
                "revisados {} objetos · {} enlaces colgados · {} descuadres",
                numero(valor, "revisados").unwrap_or(0),
                colgadas,
                descuadres
            )
        }),
        Comando::Subir {
            archivo,
            tabla,
            id,
            posicion,
            duracion,
        } => subir(
            fuente.as_mut(),
            &archivo,
            tabla,
            id,
            posicion,
            duracion,
            json,
        ),
        Comando::Volcar { clase } => volcar(fuente.as_mut(), clase.as_deref(), json),
    }
}

fn tabla_canonica(tabla: &str) -> Result<String, String> {
    let tabla = tabla.parse::<Tabla>().map_err(|error| error.to_string())?;
    Ok(tabla.nombre().to_string())
}

fn imprimir_json(valor: &Value) -> Result<(), String> {
    let texto = serde_json::to_string_pretty(valor).map_err(|error| error.to_string())?;
    println!("{texto}");
    Ok(())
}

fn estado(fuente: &mut dyn Fuente, json: bool) -> Result<(), String> {
    let resumen = fuente.resumen()?;
    if json {
        return imprimir_json(&resumen);
    }
    let tamano = resumen
        .get("tamano")
        .and_then(Value::as_u64)
        .map(|bytes| match bytes {
            0 => "-".to_string(),
            bytes => format!("{:.1} KB", bytes as f64 / 1024.0),
        })
        .unwrap_or_else(|| "-".to_string());
    salida::clave_valor(&[
        (
            "origen",
            texto_de(&resumen, "origen").unwrap_or_else(|| fuente.descripcion()),
        ),
        (
            "objetos",
            numero(&resumen, "objetos").unwrap_or(0).to_string(),
        ),
        (
            "anclas",
            numero(&resumen, "anclas").unwrap_or(0).to_string(),
        ),
        (
            "referencias",
            numero(&resumen, "aristas").unwrap_or(0).to_string(),
        ),
        (
            "pendientes",
            numero(&resumen, "sin_confirmar").unwrap_or(0).to_string(),
        ),
        ("tamaño", tamano),
    ]);
    let mut clases: Vec<Vec<String>> = Vec::new();
    if let Some(lista) = resumen.get("clases").and_then(Value::as_array) {
        for clase in lista {
            if let (Some(nombre), Some(cuantos)) = (
                clase.get(0).and_then(Value::as_str),
                clase.get(1).and_then(Value::as_u64),
            ) {
                clases.push(vec![nombre.to_string(), cuantos.to_string()]);
            }
        }
    }
    if !clases.is_empty() {
        println!();
        salida::tabla(&["CLASE", "OBJETOS"], &clases);
    }
    Ok(())
}

fn anclar(
    fuente: &mut dyn Fuente,
    tabla: &str,
    id: u64,
    texto: Option<String>,
    json: bool,
) -> Result<(), String> {
    let tabla = tabla_canonica(tabla)?;
    let respuesta = fuente.anclar(&tabla, id, texto)?;
    if json {
        return imprimir_json(&respuesta);
    }
    let oid = numero(&respuesta, "oid").unwrap_or(0);
    if respuesta
        .get("creado")
        .and_then(Value::as_bool)
        .unwrap_or(false)
    {
        salida::ok(&format!("anclado {tabla}:{id} · objeto #{oid}"));
    } else {
        salida::ok(&format!("{tabla}:{id} ya estaba anclado · objeto #{oid}"));
    }
    Ok(())
}

fn ver(fuente: &mut dyn Fuente, tabla: &str, id: u64, json: bool) -> Result<(), String> {
    let tabla = tabla_canonica(tabla)?;
    let detalle = fuente.detalle(&tabla, id)?;
    if json {
        return imprimir_json(&detalle);
    }
    let ancla = texto_de(&detalle, "ancla").unwrap_or_else(|| format!("{tabla}:{id}"));
    println!("{}", salida::titulo(&ancla));
    salida::clave_valor(&[
        (
            "clase",
            texto_de(&detalle, "clase").unwrap_or_else(|| "-".to_string()),
        ),
        (
            "objeto",
            numero(&detalle, "oid")
                .map(|oid| format!("#{oid}"))
                .unwrap_or_else(|| "-".to_string()),
        ),
        (
            "texto",
            texto_de(&detalle, "texto").unwrap_or_else(|| "-".to_string()),
        ),
    ]);

    let adjuntos = detalle
        .get("adjuntos")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    println!();
    if adjuntos.is_empty() {
        salida::aviso("sin adjuntos");
        return Ok(());
    }
    let filas: Vec<Vec<String>> = adjuntos
        .iter()
        .map(|adjunto| {
            vec![
                numero(adjunto, "posicion")
                    .map(|posicion| posicion.to_string())
                    .unwrap_or_else(|| "-".to_string()),
                tipo_de(adjunto),
                url_de(adjunto),
                numero(adjunto, "duracion")
                    .map(|segundos| format!("{segundos}s"))
                    .unwrap_or_else(|| "-".to_string()),
                numero(adjunto, "oid")
                    .map(|oid| oid.to_string())
                    .unwrap_or_else(|| "-".to_string()),
            ]
        })
        .collect();
    salida::tabla(&["POS", "TIPO", "URL", "DURACIÓN", "OID"], &filas);
    Ok(())
}

fn listar(
    fuente: &mut dyn Fuente,
    clase: Option<String>,
    limite: usize,
    json: bool,
) -> Result<(), String> {
    let Some(clase) = clase else {
        let resumen = fuente.resumen()?;
        if json {
            return imprimir_json(&resumen);
        }
        let mut filas: Vec<Vec<String>> = Vec::new();
        if let Some(lista) = resumen.get("clases").and_then(Value::as_array) {
            for entrada in lista {
                if let (Some(nombre), Some(cuantos)) = (
                    entrada.get(0).and_then(Value::as_str),
                    entrada.get(1).and_then(Value::as_u64),
                ) {
                    filas.push(vec![nombre.to_string(), cuantos.to_string()]);
                }
            }
        }
        if filas.is_empty() {
            salida::aviso("el almacén está vacío");
        } else {
            salida::tabla(&["CLASE", "OBJETOS"], &filas);
            println!();
            println!(
                "{}",
                salida::tenue(
                    "usa --clase Publicacion|Historia|Comentario para ver los contenidos"
                )
            );
        }
        return Ok(());
    };

    let clase = clase.trim().to_string();
    let contenidos: Vec<Value> = fuente.listar(&clase)?.into_iter().take(limite).collect();
    if json {
        return imprimir_json(&Value::Array(contenidos));
    }
    if contenidos.is_empty() {
        salida::aviso(&format!("no hay contenidos de la clase {clase}"));
        return Ok(());
    }
    let filas: Vec<Vec<String>> = contenidos
        .iter()
        .map(|contenido| {
            vec![
                texto_de(contenido, "ancla").unwrap_or_else(|| "-".to_string()),
                numero(contenido, "adjuntos")
                    .map(|cuantos| cuantos.to_string())
                    .unwrap_or_else(|| "0".to_string()),
                numero(contenido, "oid")
                    .map(|oid| format!("#{oid}"))
                    .unwrap_or_else(|| "-".to_string()),
            ]
        })
        .collect();
    salida::tabla(&["ANCLA", "ADJUNTOS", "OBJETO"], &filas);
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn adjuntar(
    fuente: &mut dyn Fuente,
    tabla: &str,
    id: u64,
    imagen: Option<String>,
    video: Option<String>,
    duracion: Option<u32>,
    posicion: u16,
    json: bool,
) -> Result<(), String> {
    let tabla = tabla_canonica(tabla)?;
    let (tipo, url) = match (imagen, video) {
        (Some(url), None) => {
            if duracion.is_some() {
                return Err("--duracion sólo tiene sentido con --video".to_string());
            }
            ("IMAGEN", url)
        }
        (None, Some(url)) => {
            if duracion.is_none() {
                return Err("un vídeo necesita --duracion SEGUNDOS".to_string());
            }
            ("VIDEO", url)
        }
        _ => return Err("indica --imagen URL o --video URL".to_string()),
    };
    let respuesta = fuente.adjuntar(&tabla, id, tipo, &url, posicion, duracion)?;
    if json {
        return imprimir_json(&respuesta);
    }
    let oid = numero(&respuesta, "oid").unwrap_or(0);
    salida::ok(&format!(
        "{tipo} colgada de {tabla}:{id} en la posición {posicion} · objeto #{oid}"
    ));
    Ok(())
}

fn quitar(fuente: &mut dyn Fuente, oid: u64, json: bool) -> Result<(), String> {
    let respuesta = fuente.quitar_adjunto(oid)?;
    if json {
        return imprimir_json(&respuesta);
    }
    salida::ok(&format!("adjunto #{oid} quitado y borrado"));
    Ok(())
}

fn mover(
    fuente: &mut dyn Fuente,
    tabla: &str,
    id: u64,
    oid: u64,
    posicion: u16,
    json: bool,
) -> Result<(), String> {
    let tabla = tabla_canonica(tabla)?;
    let respuesta = fuente.mover(&tabla, id, oid, posicion)?;
    if json {
        return imprimir_json(&respuesta);
    }
    salida::ok(&format!("adjunto #{oid} movido a la posición {posicion}"));
    Ok(())
}

fn borrar(
    fuente: &mut dyn Fuente,
    tabla: &str,
    id: u64,
    si: bool,
    json: bool,
) -> Result<(), String> {
    let tabla = tabla_canonica(tabla)?;
    if !si && !confirmar(&format!("¿borrar {tabla}:{id} con sus adjuntos? [s/N] "))? {
        salida::aviso("cancelado");
        return Ok(());
    }
    let respuesta = fuente.borrar(&tabla, id)?;
    if json {
        return imprimir_json(&respuesta);
    }
    let borrados = numero(&respuesta, "borrados").unwrap_or(0);
    salida::ok(&format!(
        "borrado {tabla}:{id} · {borrados} objeto{}",
        if borrados == 1 { "" } else { "s" }
    ));
    Ok(())
}

fn subir(
    fuente: &mut dyn Fuente,
    archivo: &std::path::Path,
    tabla: Option<String>,
    id: Option<u64>,
    posicion: u16,
    duracion: Option<u32>,
    json: bool,
) -> Result<(), String> {
    if tabla.is_some() != id.is_some() {
        return Err("para colgarlo hacen falta --tabla y --id".to_string());
    }
    let subido = fuente.subir(archivo)?;
    let nombre = texto_de(&subido, "nombre").unwrap_or_else(|| "-".to_string());
    let url = texto_de(&subido, "url").unwrap_or_else(|| "-".to_string());
    let tipo = texto_de(&subido, "tipo").unwrap_or_else(|| "-".to_string());
    let bytes = numero(&subido, "bytes").unwrap_or(0);
    if json {
        return imprimir_json(&subido);
    }
    salida::ok(&format!("subido {nombre} · {tipo} · {bytes} bytes"));
    println!("{}", salida::tenue(&url));

    match (tabla, id) {
        (Some(tabla), Some(id)) => {
            let tabla = tabla_canonica(&tabla)?;
            let duracion = if tipo == "VIDEO" {
                Some(duracion.ok_or_else(|| "un vídeo necesita --duracion SEGUNDOS".to_string())?)
            } else {
                None
            };
            let adjunto = fuente.adjuntar(&tabla, id, &tipo, &url, posicion, duracion)?;
            let oid = numero(&adjunto, "oid").unwrap_or(0);
            salida::ok(&format!(
                "{tipo} colgada de {tabla}:{id} en la posición {posicion} · objeto #{oid}"
            ));
        }
        _ => {
            println!();
            println!(
                "{}",
                salida::tenue("usa --tabla y --id para colgarlo de un contenido")
            );
        }
    }
    Ok(())
}

fn volcar(fuente: &mut dyn Fuente, clase: Option<&str>, json: bool) -> Result<(), String> {
    let respuesta = fuente.volcado(clase)?;
    let objetos = respuesta
        .get("objetos")
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default();
    if json {
        return imprimir_json(&Value::Array(objetos));
    }
    for objeto in &objetos {
        let texto = serde_json::to_string(objeto).map_err(|error| error.to_string())?;
        println!("{texto}");
    }
    let cuantos = objetos.len();
    salida::aviso(&format!(
        "{cuantos} objeto{} volcado{}",
        if cuantos == 1 { "" } else { "s" },
        if cuantos == 1 { "" } else { "s" }
    ));
    Ok(())
}

fn informe(
    respuesta: Result<Value, String>,
    json: bool,
    describir: impl Fn(&Value) -> String,
) -> Result<(), String> {
    let valor = respuesta?;
    if json {
        return imprimir_json(&valor);
    }
    salida::ok(&describir(&valor));
    Ok(())
}

fn avisos(valor: &Value) -> String {
    match valor.get("avisos").and_then(Value::as_array) {
        Some(avisos) if !avisos.is_empty() => {
            let lista: Vec<String> = avisos
                .iter()
                .filter_map(Value::as_str)
                .map(str::to_string)
                .collect();
            format!("\n  avisos: {}", lista.join(" · "))
        }
        _ => String::new(),
    }
}

fn confirmar(pregunta: &str) -> Result<bool, String> {
    print!("{pregunta}");
    std::io::stdout()
        .flush()
        .map_err(|error| error.to_string())?;
    let mut linea = String::new();
    std::io::stdin()
        .read_line(&mut linea)
        .map_err(|error| error.to_string())?;
    Ok(matches!(
        linea.trim().to_lowercase().as_str(),
        "s" | "si" | "sí" | "y" | "yes"
    ))
}
