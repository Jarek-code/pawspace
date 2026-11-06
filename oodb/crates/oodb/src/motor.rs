//! El motor: mapa de identidad, catálogo, borrado, confirmación y descarte.

use std::any::{Any, type_name};
use std::collections::{BTreeMap, BTreeSet};
use std::path::Path;

use serde_json::Value;

use crate::almacen::{Almacen, Alta, Baja, Cambios};
use crate::catalogo::Catalogo;
use crate::error::{Error, Resultado};
use crate::migracion::Migrador;
use crate::objeto::Objeto;
use crate::oid::{Oid, Referencia};

/// Versión del formato de registro que escribe este binario.
pub const FORMATO: u32 = 1;

/// Qué hacer con las referencias de un objeto que se borra.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Politica {
    /// Borrar también lo que el objeto referencia.
    #[default]
    Cascada,
    /// Negarse si otro objeto lo referencia.
    Rechazar,
}

/// Ajustes de apertura.
#[derive(Clone, Copy, Debug)]
pub struct Opciones {
    cargar_objetos: bool,
}

impl Default for Opciones {
    fn default() -> Self {
        Opciones {
            cargar_objetos: true,
        }
    }
}

impl Opciones {
    /// Carga objetos y catálogo.
    pub fn todo() -> Self {
        Self::default()
    }

    /// Carga sólo el catálogo: sirve para contar, listar OIDs y recorrer índices.
    pub fn catalogo() -> Self {
        Opciones {
            cargar_objetos: false,
        }
    }
}

/// Resultado de una confirmación.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Informe {
    /// Objetos escritos.
    pub escritos: usize,
    /// Objetos borrados.
    pub borrados: usize,
}

/// Resultado de la comprobación de integridad.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct InformeIntegridad {
    /// Objetos revisados.
    pub revisados: usize,
    /// Enlaces que apuntan a un OID inexistente, como `(desde, hacia)`.
    pub colgadas: Vec<(Oid, Oid)>,
    /// OIDs del catálogo sin objeto en memoria.
    pub descuadres: Vec<Oid>,
}

impl InformeIntegridad {
    /// Sin colgadas ni descuadres.
    pub fn esta_bien(&self) -> bool {
        self.colgadas.is_empty() && self.descuadres.is_empty()
    }
}

/// Claves de índice que declara un objeto.
pub(crate) type Claves = Vec<(&'static str, String)>;

/// Base de datos orientada a objetos abierta.
pub struct Db {
    almacen: Almacen,
    catalogo: Catalogo,
    objetos: BTreeMap<Oid, Box<dyn Objeto>>,
    sucios: BTreeSet<Oid>,
    nuevos: BTreeSet<Oid>,
    borrados: BTreeMap<Oid, (String, Claves)>,
    aristas_altas: BTreeSet<(Oid, Oid)>,
    aristas_bajas: BTreeSet<(Oid, Oid)>,
    ultimo_oid: u64,
    migraciones: Migrador,
    cargado: bool,
}

impl Db {
    /// Abre la base con todas las opciones por omisión.
    pub fn abrir(ruta: impl AsRef<Path>) -> Resultado<Self> {
        Self::abrir_con(ruta, Opciones::todo(), Migrador::nuevo())
    }

    /// Abre la base con opciones y migraciones explícitas.
    pub fn abrir_con(
        ruta: impl AsRef<Path>,
        opciones: Opciones,
        migraciones: Migrador,
    ) -> Resultado<Self> {
        let almacen = Almacen::abrir(ruta.as_ref())?;
        let catalogo = Catalogo::desde(&almacen)?;
        let ultimo_oid = almacen.leer_meta("ultimo_oid")?.unwrap_or(0);
        let formato = almacen.leer_meta("formato")?.unwrap_or(u64::from(FORMATO)) as u32;
        if formato > FORMATO {
            return Err(Error::FormatoDesconocido {
                encontrado: formato,
                esperado: FORMATO,
            });
        }
        let mut db = Db {
            almacen,
            catalogo,
            objetos: BTreeMap::new(),
            sucios: BTreeSet::new(),
            nuevos: BTreeSet::new(),
            borrados: BTreeMap::new(),
            aristas_altas: BTreeSet::new(),
            aristas_bajas: BTreeSet::new(),
            ultimo_oid,
            migraciones,
            cargado: opciones.cargar_objetos,
        };
        if opciones.cargar_objetos {
            db.cargar()?;
            db.sincronizar_aristas();
        }
        Ok(db)
    }

    fn cargar(&mut self) -> Resultado<()> {
        for (oid, bytes) in self.almacen.leer_objetos()? {
            let (objeto, migrado) = self.decodificar(&bytes)?;
            self.catalogo
                .insertar(oid, objeto.clase(), &objeto.claves())?;
            self.objetos.insert(oid, objeto);
            if migrado {
                self.sucios.insert(oid);
            }
        }
        Ok(())
    }

    /// Pone la adyacencia en memoria de acuerdo con los objetos cargados.
    ///
    /// Cubre las bases escritas antes de que existiera el índice de aristas.
    fn sincronizar_aristas(&mut self) {
        let declaradas: Vec<(Oid, BTreeSet<Oid>)> = self
            .objetos
            .iter()
            .map(|(oid, objeto)| (*oid, objeto.referencias().into_iter().collect()))
            .collect();
        for (oid, referencias) in declaradas {
            for hacia in &referencias {
                if self.catalogo.conectar(oid, *hacia) {
                    self.aristas_altas.insert((oid, *hacia));
                }
            }
            for hacia in self.catalogo.salientes(oid) {
                if !referencias.contains(&hacia) && self.catalogo.desconectar(oid, hacia) {
                    self.aristas_bajas.insert((oid, hacia));
                }
            }
        }
    }

    fn decodificar(&self, bytes: &[u8]) -> Resultado<(Box<dyn Objeto>, bool)> {
        let mut valor: Value = serde_json::from_slice(bytes)?;
        let version = valor
            .get("v")
            .and_then(Value::as_u64)
            .map_or(FORMATO, |v| v as u32);
        let migrado = version < FORMATO;
        if migrado {
            let clase = valor
                .get("clase")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            valor = self.migraciones.migrar(&clase, version, valor)?;
        }
        let objeto = serde_json::from_value::<Box<dyn Objeto>>(valor)?;
        Ok((objeto, migrado))
    }

    /// Ruta del archivo del almacén.
    pub fn ruta(&self) -> &Path {
        self.almacen.ruta()
    }

    /// Si la base se abrió con los objetos materializados.
    pub fn cargado(&self) -> bool {
        self.cargado
    }

    fn exigir_objetos(&self, operacion: &'static str) -> Resultado<()> {
        if self.cargado {
            Ok(())
        } else {
            Err(Error::SinObjetos(operacion))
        }
    }

    /// Da identidad a un objeto nuevo y lo deja pendiente de confirmar.
    pub fn insertar(&mut self, objeto: Box<dyn Objeto>) -> Resultado<Oid> {
        self.exigir_objetos("insertar")?;
        self.ultimo_oid += 1;
        let oid = Oid::nuevo(self.ultimo_oid);
        self.catalogo
            .insertar(oid, objeto.clase(), &objeto.claves())?;
        self.objetos.insert(oid, objeto);
        self.sucios.insert(oid);
        self.nuevos.insert(oid);
        Ok(oid)
    }

    /// El objeto con ese OID, como raíz de la jerarquía.
    pub fn objeto(&self, oid: Oid) -> Resultado<&dyn Objeto> {
        match self.objetos.get(&oid) {
            Some(objeto) => Ok(objeto.as_ref()),
            None if self.catalogo.contiene(oid) || self.borrados.contains_key(&oid) => {
                Err(Error::NoCargado(oid))
            }
            None => Err(Error::NoEncontrado(oid)),
        }
    }

    /// Igual que [`Db::objeto`], pero deja el objeto marcado como pendiente.
    pub fn objeto_mut(&mut self, oid: Oid) -> Resultado<&mut dyn Objeto> {
        self.sucios.insert(oid);
        match self.objetos.get_mut(&oid) {
            Some(objeto) => Ok(objeto.as_mut()),
            None if self.catalogo.contiene(oid) => Err(Error::NoCargado(oid)),
            None => Err(Error::NoEncontrado(oid)),
        }
    }

    /// El objeto como su clase concreta.
    pub fn concreto<T: Any>(&self, oid: Oid) -> Resultado<&T> {
        self.objeto(oid)?
            .as_any()
            .downcast_ref()
            .ok_or(Error::TipoEquivocado {
                oid,
                esperado: type_name::<T>(),
            })
    }

    /// Resuelve el objeto al que apunta una referencia.
    pub fn obtener<T: Any>(&self, referencia: &Referencia<T>) -> Resultado<&T> {
        self.concreto::<T>(referencia.oid())
    }

    /// Igual que [`Db::obtener`], pero para modificar el objeto.
    pub fn obtener_mut<T: Any>(&mut self, referencia: &Referencia<T>) -> Resultado<&mut T> {
        let oid = referencia.oid();
        self.objeto_mut(oid)?
            .as_any_mut()
            .downcast_mut()
            .ok_or(Error::TipoEquivocado {
                oid,
                esperado: type_name::<T>(),
            })
    }

    /// Todos los objetos cargados con su OID, en orden.
    pub fn extent(&self) -> impl Iterator<Item = (Oid, &dyn Objeto)> {
        self.objetos
            .iter()
            .map(|(oid, objeto)| (*oid, objeto.as_ref()))
    }

    /// OIDs de una clase, según el catálogo.
    pub fn por_clase(&self, clase: &str) -> Vec<Oid> {
        self.catalogo.por_clase(clase)
    }

    /// OID que ocupa una clave de índice.
    pub fn por_clave(&self, indice: &str, clave: &str) -> Option<Oid> {
        self.catalogo.por_clave(indice, clave)
    }

    /// Todas las claves de índice ocupadas, como `(indice, clave, oid)`.
    pub fn claves(&self) -> Vec<(String, String, Oid)> {
        self.catalogo.claves()
    }

    /// Claves de un índice concreto.
    pub fn claves_de(&self, indice: &str) -> Vec<(String, Oid)> {
        self.catalogo
            .claves()
            .into_iter()
            .filter(|(nombre, _, _)| nombre == indice)
            .map(|(_, clave, oid)| (clave, oid))
            .collect()
    }

    /// Objetos que hay en el catálogo.
    pub fn total(&self) -> usize {
        self.catalogo.total()
    }

    /// Objetos por clase, para la interfaz.
    pub fn conteo_clases(&self) -> Vec<(String, usize)> {
        self.catalogo.conteo_clases()
    }

    /// Cambios pendientes de confirmar.
    pub fn sin_confirmar(&self) -> usize {
        self.sucios.len()
            + self.borrados.len()
            + self.aristas_altas.len()
            + self.aristas_bajas.len()
    }

    /// Borra el objeto y, en cascada, lo que referencia.
    pub fn eliminar(&mut self, oid: Oid) -> Resultado<usize> {
        self.eliminar_con(oid, Politica::Cascada)
    }

    /// Borra con la política indicada; devuelve cuántos objetos se borraron.
    pub fn eliminar_con(&mut self, oid: Oid, politica: Politica) -> Resultado<usize> {
        self.exigir_objetos("eliminar")?;
        let mut pendientes = vec![oid];
        let mut visitados = BTreeSet::new();
        let mut total = 0;
        while let Some(actual) = pendientes.pop() {
            if !visitados.insert(actual) {
                continue;
            }
            let (clase, claves, referencias) = {
                let objeto = self.objeto(actual)?;
                (
                    objeto.clase().to_string(),
                    objeto.claves(),
                    objeto.referencias(),
                )
            };
            if politica == Politica::Rechazar {
                let entrantes = self.referencias_entrantes(actual);
                if !entrantes.is_empty() {
                    return Err(Error::TieneReferencias {
                        oid: actual,
                        cuantas: entrantes.len(),
                    });
                }
            }
            pendientes.extend(referencias);
            for hacia in self.catalogo.salientes(actual) {
                if self.catalogo.desconectar(actual, hacia) {
                    self.aristas_bajas.insert((actual, hacia));
                }
            }
            self.catalogo.quitar(actual, &clase, &claves);
            self.objetos.remove(&actual);
            self.sucios.remove(&actual);
            self.nuevos.remove(&actual);
            self.borrados.insert(actual, (clase, claves));
            total += 1;
        }
        Ok(total)
    }

    /// Objetos que apuntan a `oid`, según el índice de aristas.
    pub fn referencias_entrantes(&self, oid: Oid) -> Vec<Oid> {
        self.catalogo.entrantes(oid)
    }

    /// Objetos a los que apunta `oid`.
    pub fn referencias_salientes(&self, oid: Oid) -> Vec<Oid> {
        self.catalogo.salientes(oid)
    }

    /// Aristas registradas entre objetos.
    pub fn total_aristas(&self) -> usize {
        self.catalogo.total_aristas()
    }

    /// Escribe en una sola transacción lo nuevo y lo modificado, y aplica los borrados.
    pub fn commit(&mut self) -> Resultado<Informe> {
        if self.sucios.is_empty()
            && self.borrados.is_empty()
            && self.aristas_altas.is_empty()
            && self.aristas_bajas.is_empty()
        {
            return Ok(Informe::default());
        }
        let mut altas = Vec::with_capacity(self.sucios.len());
        for oid in &self.sucios {
            let objeto = self.objeto(*oid)?;
            let mut valor = serde_json::to_value(objeto)?;
            if let Value::Object(mapa) = &mut valor {
                mapa.insert("v".to_string(), Value::from(FORMATO));
            }
            altas.push(Alta {
                oid: *oid,
                clase: objeto.clase(),
                claves: objeto.claves(),
                bytes: serde_json::to_vec(&valor)?,
            });
        }
        let bajas: Vec<Baja> = self
            .borrados
            .iter()
            .map(|(oid, (_, claves))| Baja {
                oid: *oid,
                claves: claves.clone(),
            })
            .collect();
        let declaradas: Vec<(Oid, BTreeSet<Oid>)> = self
            .sucios
            .iter()
            .map(|oid| {
                self.objeto(*oid)
                    .map(|objeto| (*oid, objeto.referencias().into_iter().collect()))
            })
            .collect::<Resultado<_>>()?;
        for (oid, referencias) in declaradas {
            for hacia in &referencias {
                if self.catalogo.conectar(oid, *hacia) && !self.aristas_bajas.remove(&(oid, *hacia))
                {
                    self.aristas_altas.insert((oid, *hacia));
                }
            }
            for hacia in self.catalogo.salientes(oid) {
                if !referencias.contains(&hacia)
                    && self.catalogo.desconectar(oid, hacia)
                    && !self.aristas_altas.remove(&(oid, hacia))
                {
                    self.aristas_bajas.insert((oid, hacia));
                }
            }
        }
        let aristas_altas: Vec<(Oid, Oid)> = self.aristas_altas.iter().copied().collect();
        let aristas_bajas: Vec<(Oid, Oid)> = self.aristas_bajas.iter().copied().collect();
        let meta = [
            ("ultimo_oid", self.ultimo_oid),
            ("formato", u64::from(FORMATO)),
        ];
        self.almacen.aplicar(Cambios {
            altas: &altas,
            bajas: &bajas,
            aristas_altas: &aristas_altas,
            aristas_bajas: &aristas_bajas,
            meta: &meta,
        })?;
        let informe = Informe {
            escritos: altas.len(),
            borrados: bajas.len(),
        };
        self.sucios.clear();
        self.nuevos.clear();
        self.borrados.clear();
        self.aristas_altas.clear();
        self.aristas_bajas.clear();
        Ok(informe)
    }

    /// Deshace los cambios sin confirmar: recarga lo sucio y recupera lo borrado.
    pub fn descartar(&mut self) -> Resultado<()> {
        self.exigir_objetos("descartar")?;
        for oid in std::mem::take(&mut self.nuevos) {
            if let Some(objeto) = self.objetos.remove(&oid) {
                self.catalogo.quitar(oid, objeto.clase(), &objeto.claves());
            }
            self.sucios.remove(&oid);
        }
        for oid in std::mem::take(&mut self.sucios) {
            match self.almacen.leer_uno(oid)? {
                Some(bytes) => {
                    let (objeto, _) = self.decodificar(&bytes)?;
                    self.objetos.insert(oid, objeto);
                }
                None => {
                    self.objetos.remove(&oid);
                }
            }
        }
        for (oid, (clase, claves)) in std::mem::take(&mut self.borrados) {
            if let Some(bytes) = self.almacen.leer_uno(oid)? {
                let (objeto, _) = self.decodificar(&bytes)?;
                self.catalogo.insertar(oid, &clase, &claves)?;
                self.objetos.insert(oid, objeto);
            }
        }
        let pares: Vec<(Oid, Oid)> = self
            .objetos
            .iter()
            .flat_map(|(desde, objeto)| {
                objeto
                    .referencias()
                    .into_iter()
                    .map(move |hacia| (*desde, hacia))
            })
            .collect();
        self.catalogo.rehacer_aristas(pares);
        self.aristas_altas.clear();
        self.aristas_bajas.clear();
        Ok(())
    }

    /// Ejecuta un bloque como transacción: confirma si termina bien y descarta si falla.
    pub fn en_transaccion<T>(
        &mut self,
        bloque: impl FnOnce(&mut Self) -> Resultado<T>,
    ) -> Resultado<T> {
        match bloque(self) {
            Ok(valor) => {
                self.commit()?;
                Ok(valor)
            }
            Err(error) => {
                self.descartar()?;
                Err(error)
            }
        }
    }

    /// Comprueba los enlaces de los objetos cargados contra el catálogo.
    pub fn verificar(&self) -> Resultado<InformeIntegridad> {
        let mut informe = InformeIntegridad {
            revisados: self.catalogo.total(),
            ..InformeIntegridad::default()
        };
        for (desde, hacia) in self.catalogo.aristas() {
            let existe = self.catalogo.contiene(hacia) || self.borrados.contains_key(&hacia);
            if !existe {
                informe.colgadas.push((desde, hacia));
            }
        }
        if self.cargado {
            for oid in self.catalogo.oids() {
                let presente = self.objetos.contains_key(&oid) || self.nuevos.contains(&oid);
                if !presente && !self.borrados.contains_key(&oid) {
                    informe.descuadres.push(oid);
                }
            }
        }
        Ok(informe)
    }

    /// Compacta el archivo del almacén.
    pub fn compactar(&mut self) -> Resultado<bool> {
        self.almacen.compactar()
    }

    /// Comprueba las estructuras internas del almacén.
    pub fn comprobar_almacen(&mut self) -> Resultado<bool> {
        self.almacen.verificar()
    }

    /// Tamaño del archivo en bytes.
    pub fn tamano(&self) -> Resultado<u64> {
        self.almacen.tamano()
    }

    /// Lo confirmado en el almacén, en JSON compacto (depuración).
    pub fn volcado(&self) -> Resultado<Vec<(Oid, String)>> {
        self.almacen
            .leer_objetos()?
            .into_iter()
            .map(|(oid, bytes)| {
                let valor: Value = serde_json::from_slice(&bytes)?;
                Ok((oid, serde_json::to_string(&valor)?))
            })
            .collect()
    }
}
