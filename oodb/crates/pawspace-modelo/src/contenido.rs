//! Los tres contenidos anclados a una fila de MariaDB.

use oodb::{Error, Objeto, Oid, Resultado};
use serde::{Deserialize, Serialize};

use crate::adjunto::{Adjunto, RefAdjunto, TipoAdjunto};
use crate::ancla::{Ancla, INDICE_ANCLA, Tabla};

/// Máximo de adjuntos que admite un contenido.
pub const ADJUNTOS_MAXIMOS: usize = 10;
/// Límite de aplicación para el texto de una publicación.
pub const TEXTO_PUBLICACION_MAXIMO: usize = 5000;
/// Límite de aplicación para el texto de un comentario.
pub const TEXTO_COMENTARIO_MAXIMO: usize = 2000;

/// Lo común a todo contenido: el ancla y la lista ordenada de adjuntos.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DatosContenido {
    ancla: Ancla,
    #[serde(default)]
    adjuntos: Vec<RefAdjunto>,
}

impl DatosContenido {
    /// Datos de un contenido recién anclado, todavía sin adjuntos.
    pub fn nuevo(ancla: Ancla) -> Self {
        DatosContenido {
            ancla,
            adjuntos: Vec::new(),
        }
    }

    /// Fila relacional anclada.
    pub fn ancla(&self) -> &Ancla {
        &self.ancla
    }

    /// Adjuntos enlazados, en orden de llegada.
    pub fn adjuntos(&self) -> &[RefAdjunto] {
        &self.adjuntos
    }

    /// Enlaza un adjunto: sin repetir y hasta [`ADJUNTOS_MAXIMOS`].
    pub fn adjuntar(&mut self, adjunto: RefAdjunto) -> Resultado<()> {
        if self.adjuntos.contains(&adjunto) {
            return Err(Error::Invalido(format!(
                "el adjunto {} ya cuelga de este contenido",
                adjunto.oid()
            )));
        }
        if self.adjuntos.len() >= ADJUNTOS_MAXIMOS {
            return Err(Error::Invalido(format!(
                "un contenido admite como máximo {ADJUNTOS_MAXIMOS} adjuntos"
            )));
        }
        self.adjuntos.push(adjunto);
        Ok(())
    }

    /// Desenlaza el adjunto; dice si estaba.
    pub fn separar(&mut self, oid: Oid) -> bool {
        let antes = self.adjuntos.len();
        self.adjuntos.retain(|adjunto| adjunto.oid() != oid);
        self.adjuntos.len() != antes
    }

    fn claves(&self) -> Vec<(&'static str, String)> {
        vec![(INDICE_ANCLA, self.ancla.clave())]
    }

    fn referencias(&self) -> Vec<Oid> {
        self.adjuntos.iter().map(|adjunto| adjunto.oid()).collect()
    }
}

/// Contenido anclado a una fila: lo que un contenido con adjuntos tiene en común.
pub trait Contenido: Objeto {
    /// Datos comunes.
    fn base(&self) -> &DatosContenido;

    /// Datos comunes, mutables.
    fn base_mut(&mut self) -> &mut DatosContenido;

    /// Fila relacional anclada.
    fn ancla(&self) -> &Ancla {
        self.base().ancla()
    }

    /// Adjuntos enlazados.
    fn adjuntos(&self) -> &[RefAdjunto] {
        self.base().adjuntos()
    }

    /// Enlaza un adjunto.
    fn adjuntar(&mut self, adjunto: RefAdjunto) -> Resultado<()> {
        self.base_mut().adjuntar(adjunto)
    }

    /// Desenlaza un adjunto.
    fn separar(&mut self, oid: Oid) -> bool {
        self.base_mut().separar(oid)
    }

    /// Comprueba que la tabla anclada admite ese tipo de adjunto.
    fn acepta(&self, adjunto: &dyn Adjunto) -> Resultado<()> {
        if adjunto.tipo() == TipoAdjunto::Video && !self.ancla().tabla().admite_video() {
            return Err(Error::Invalido(format!(
                "{} sólo admite imágenes",
                self.ancla().tabla()
            )));
        }
        Ok(())
    }
}

/// Baja un objeto a la familia de los contenidos.
pub fn como_contenido(objeto: &dyn Objeto) -> Option<&dyn Contenido> {
    let any = objeto.as_any();
    if let Some(publicacion) = any.downcast_ref::<Publicacion>() {
        Some(publicacion)
    } else if let Some(historia) = any.downcast_ref::<Historia>() {
        Some(historia)
    } else {
        any.downcast_ref::<Comentario>()
            .map(|c| c as &dyn Contenido)
    }
}

/// Baja un objeto a la familia de los contenidos, para modificarlo.
pub fn como_contenido_mut(objeto: &mut dyn Objeto) -> Option<&mut dyn Contenido> {
    match objeto.clase() {
        "Publicacion" => objeto
            .as_any_mut()
            .downcast_mut::<Publicacion>()
            .map(|c| c as &mut dyn Contenido),
        "Historia" => objeto
            .as_any_mut()
            .downcast_mut::<Historia>()
            .map(|c| c as &mut dyn Contenido),
        "Comentario" => objeto
            .as_any_mut()
            .downcast_mut::<Comentario>()
            .map(|c| c as &mut dyn Contenido),
        _ => None,
    }
}

fn normalizar_texto(texto: Option<String>, maximo: usize, que: &str) -> Resultado<Option<String>> {
    let texto = texto
        .map(|texto| texto.trim().to_string())
        .filter(|texto| !texto.is_empty());
    if let Some(texto) = &texto
        && texto.chars().count() > maximo
    {
        return Err(Error::Invalido(format!(
            "el texto de {que} supera {maximo} caracteres"
        )));
    }
    Ok(texto)
}

fn exigir_tabla(ancla: &Ancla, tabla: Tabla) -> Resultado<()> {
    if ancla.tabla() == tabla {
        Ok(())
    } else {
        Err(Error::Invalido(format!(
            "un contenido de {} no puede anclar {}",
            tabla,
            ancla.tabla()
        )))
    }
}

/// Publicación del muro.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Publicacion {
    #[serde(flatten)]
    base: DatosContenido,
    #[serde(default)]
    texto: Option<String>,
}

impl Publicacion {
    /// Publicación anclada a `PUBLICACION.registro_id`.
    pub fn nueva(ancla: Ancla, texto: Option<String>) -> Resultado<Self> {
        exigir_tabla(&ancla, Tabla::Publicacion)?;
        Ok(Publicacion {
            base: DatosContenido::nuevo(ancla),
            texto: normalizar_texto(texto, TEXTO_PUBLICACION_MAXIMO, "la publicación")?,
        })
    }

    /// Texto de la publicación, si lo tiene.
    pub fn texto(&self) -> Option<&str> {
        self.texto.as_deref()
    }

    /// Cambia el texto.
    pub fn cambiar_texto(&mut self, texto: Option<String>) -> Resultado<()> {
        self.texto = normalizar_texto(texto, TEXTO_PUBLICACION_MAXIMO, "la publicación")?;
        Ok(())
    }
}

#[typetag::serde]
impl Objeto for Publicacion {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
        self
    }
    fn clase(&self) -> &'static str {
        "Publicacion"
    }
    fn claves(&self) -> Vec<(&'static str, String)> {
        self.base.claves()
    }
    fn referencias(&self) -> Vec<Oid> {
        self.base.referencias()
    }
}

impl Contenido for Publicacion {
    fn base(&self) -> &DatosContenido {
        &self.base
    }
    fn base_mut(&mut self) -> &mut DatosContenido {
        &mut self.base
    }
}

/// Historia que vence; en el esquema no lleva texto.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Historia {
    #[serde(flatten)]
    base: DatosContenido,
}

impl Historia {
    /// Historia anclada a `HISTORIA.registro_id`.
    pub fn nueva(ancla: Ancla) -> Resultado<Self> {
        exigir_tabla(&ancla, Tabla::Historia)?;
        Ok(Historia {
            base: DatosContenido::nuevo(ancla),
        })
    }
}

#[typetag::serde]
impl Objeto for Historia {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
        self
    }
    fn clase(&self) -> &'static str {
        "Historia"
    }
    fn claves(&self) -> Vec<(&'static str, String)> {
        self.base.claves()
    }
    fn referencias(&self) -> Vec<Oid> {
        self.base.referencias()
    }
}

impl Contenido for Historia {
    fn base(&self) -> &DatosContenido {
        &self.base
    }
    fn base_mut(&mut self) -> &mut DatosContenido {
        &mut self.base
    }
}

/// Comentario de una publicación; sólo admite imágenes.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Comentario {
    #[serde(flatten)]
    base: DatosContenido,
    texto: String,
}

impl Comentario {
    /// Comentario anclado a `COMENTARIO.registro_id`.
    ///
    /// El texto puede ir vacío: la OODB no guarda el contenido del comentario, sólo sus
    /// adjuntos, y quien exige texto es la fila relacional.
    pub fn nuevo(ancla: Ancla, texto: impl Into<String>) -> Resultado<Self> {
        exigir_tabla(&ancla, Tabla::Comentario)?;
        let texto = normalizar_texto(Some(texto.into()), TEXTO_COMENTARIO_MAXIMO, "el comentario")?
            .unwrap_or_default();
        Ok(Comentario {
            base: DatosContenido::nuevo(ancla),
            texto,
        })
    }

    /// Texto del comentario.
    pub fn texto(&self) -> &str {
        &self.texto
    }

    /// Cambia el texto.
    pub fn cambiar_texto(&mut self, texto: impl Into<String>) -> Resultado<()> {
        self.texto =
            normalizar_texto(Some(texto.into()), TEXTO_COMENTARIO_MAXIMO, "el comentario")?
                .ok_or_else(|| Error::Invalido("el comentario necesita texto".into()))?;
        Ok(())
    }
}

#[typetag::serde]
impl Objeto for Comentario {
    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
    fn as_any_mut(&mut self) -> &mut dyn std::any::Any {
        self
    }
    fn clase(&self) -> &'static str {
        "Comentario"
    }
    fn claves(&self) -> Vec<(&'static str, String)> {
        self.base.claves()
    }
    fn referencias(&self) -> Vec<Oid> {
        self.base.referencias()
    }
}

impl Contenido for Comentario {
    fn base(&self) -> &DatosContenido {
        &self.base
    }
    fn base_mut(&mut self) -> &mut DatosContenido {
        &mut self.base
    }
}
