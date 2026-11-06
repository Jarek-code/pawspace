//! Catálogo en memoria: clases, claves de índice y adyacencia entre objetos.

use std::collections::{BTreeMap, BTreeSet};

use crate::almacen::Almacen;
use crate::error::{Error, Resultado};
use crate::oid::Oid;

#[derive(Default)]
pub(crate) struct Catalogo {
    clases: BTreeMap<String, BTreeSet<Oid>>,
    indices: BTreeMap<(String, String), Oid>,
    salen: BTreeMap<Oid, BTreeSet<Oid>>,
    entran: BTreeMap<Oid, BTreeSet<Oid>>,
}

impl Catalogo {
    pub(crate) fn desde(almacen: &Almacen) -> Resultado<Self> {
        let mut catalogo = Catalogo::default();
        for (oid, clase) in almacen.leer_clases()? {
            catalogo.clases.entry(clase).or_default().insert(oid);
        }
        for (indice, clave, oid) in almacen.leer_indices()? {
            catalogo.indices.insert((indice, clave), oid);
        }
        for (desde, hacia) in almacen.leer_aristas()? {
            catalogo.conectar(desde, hacia);
        }
        Ok(catalogo)
    }

    pub(crate) fn insertar(
        &mut self,
        oid: Oid,
        clase: &str,
        claves: &[(&'static str, String)],
    ) -> Resultado<()> {
        for (indice, clave) in claves {
            if let Some(actual) = self.indices.get(&(indice.to_string(), clave.clone()))
                && *actual != oid
            {
                return Err(Error::ClaveDuplicada {
                    indice,
                    clave: clave.clone(),
                });
            }
        }
        self.clases
            .entry(clase.to_string())
            .or_default()
            .insert(oid);
        for (indice, clave) in claves {
            self.indices
                .insert((indice.to_string(), clave.clone()), oid);
        }
        Ok(())
    }

    pub(crate) fn quitar(&mut self, oid: Oid, clase: &str, claves: &[(&'static str, String)]) {
        if let Some(conjunto) = self.clases.get_mut(clase) {
            conjunto.remove(&oid);
        }
        if self.clases.get(clase).is_some_and(BTreeSet::is_empty) {
            self.clases.remove(clase);
        }
        for (indice, clave) in claves {
            let llave = (indice.to_string(), clave.clone());
            if self.indices.get(&llave) == Some(&oid) {
                self.indices.remove(&llave);
            }
        }
    }

    pub(crate) fn contiene(&self, oid: Oid) -> bool {
        self.clases.values().any(|conjunto| conjunto.contains(&oid))
    }

    pub(crate) fn por_clase(&self, clase: &str) -> Vec<Oid> {
        self.clases
            .get(clase)
            .map(|conjunto| conjunto.iter().copied().collect())
            .unwrap_or_default()
    }

    pub(crate) fn por_clave(&self, indice: &str, clave: &str) -> Option<Oid> {
        self.indices
            .get(&(indice.to_string(), clave.to_string()))
            .copied()
    }

    pub(crate) fn claves(&self) -> Vec<(String, String, Oid)> {
        self.indices
            .iter()
            .map(|((indice, clave), oid)| (indice.clone(), clave.clone(), *oid))
            .collect()
    }

    pub(crate) fn oids(&self) -> Vec<Oid> {
        self.clases.values().flatten().copied().collect()
    }

    pub(crate) fn total(&self) -> usize {
        self.clases.values().map(BTreeSet::len).sum()
    }

    pub(crate) fn conteo_clases(&self) -> Vec<(String, usize)> {
        self.clases
            .iter()
            .map(|(clase, conjunto)| (clase.clone(), conjunto.len()))
            .collect()
    }

    /// Registra la arista `desde -> hacia`; dice si era nueva.
    pub(crate) fn conectar(&mut self, desde: Oid, hacia: Oid) -> bool {
        let nueva = self.salen.entry(desde).or_default().insert(hacia);
        self.entran.entry(hacia).or_default().insert(desde);
        nueva
    }

    /// Quita la arista `desde -> hacia`; dice si existía.
    pub(crate) fn desconectar(&mut self, desde: Oid, hacia: Oid) -> bool {
        let existia = self
            .salen
            .get_mut(&desde)
            .is_some_and(|conjunto| conjunto.remove(&hacia));
        if self.salen.get(&desde).is_some_and(BTreeSet::is_empty) {
            self.salen.remove(&desde);
        }
        if let Some(conjunto) = self.entran.get_mut(&hacia) {
            conjunto.remove(&desde);
        }
        if self.entran.get(&hacia).is_some_and(BTreeSet::is_empty) {
            self.entran.remove(&hacia);
        }
        existia
    }

    /// Objetos a los que apunta `oid`.
    pub(crate) fn salientes(&self, oid: Oid) -> Vec<Oid> {
        self.salen
            .get(&oid)
            .map(|conjunto| conjunto.iter().copied().collect())
            .unwrap_or_default()
    }

    /// Objetos que apuntan a `oid`.
    pub(crate) fn entrantes(&self, oid: Oid) -> Vec<Oid> {
        self.entran
            .get(&oid)
            .map(|conjunto| conjunto.iter().copied().collect())
            .unwrap_or_default()
    }

    /// Todas las aristas, como `(desde, hacia)`.
    pub(crate) fn aristas(&self) -> Vec<(Oid, Oid)> {
        self.salen
            .iter()
            .flat_map(|(desde, hacia)| hacia.iter().map(move |destino| (*desde, *destino)))
            .collect()
    }

    /// Cuántas aristas hay.
    pub(crate) fn total_aristas(&self) -> usize {
        self.salen.values().map(BTreeSet::len).sum()
    }

    /// Rehace la adyacencia entera a partir del grafo de objetos.
    pub(crate) fn rehacer_aristas(&mut self, pares: impl IntoIterator<Item = (Oid, Oid)>) {
        self.salen.clear();
        self.entran.clear();
        for (desde, hacia) in pares {
            self.conectar(desde, hacia);
        }
    }
}
