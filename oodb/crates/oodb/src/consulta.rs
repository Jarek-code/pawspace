//! Consultas: ventanas de resultados y filtros sobre las clases cargadas.

use std::any::Any;

use crate::motor::Db;
use crate::oid::Referencia;

/// Ventana sobre un conjunto de resultados.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Pagina {
    /// Resultados que se saltan.
    pub desde: usize,
    /// Resultados que se devuelven como máximo.
    pub cuantos: usize,
}

impl Default for Pagina {
    fn default() -> Self {
        Pagina {
            desde: 0,
            cuantos: usize::MAX,
        }
    }
}

impl Pagina {
    /// Ventana a partir de `desde`.
    pub fn nueva(desde: usize, cuantos: usize) -> Self {
        Pagina { desde, cuantos }
    }

    /// Recorta la ventana a un total conocido.
    pub fn recortar(&self, total: usize) -> (usize, usize) {
        let desde = self.desde.min(total);
        let hasta = desde.saturating_add(self.cuantos).min(total);
        (desde, hasta)
    }
}

impl Db {
    /// Objetos de la clase `T` que cumplen el predicado, paginados.
    pub fn filtrar<T: Any>(
        &self,
        predicado: impl Fn(&T) -> bool,
        pagina: Pagina,
    ) -> Vec<Referencia<T>> {
        let encontrados: Vec<Referencia<T>> = self
            .extent()
            .filter_map(|(oid, objeto)| {
                objeto
                    .as_any()
                    .downcast_ref::<T>()
                    .filter(|concreto| predicado(concreto))
                    .map(|_| Referencia::nueva(oid))
            })
            .collect();
        let (desde, hasta) = pagina.recortar(encontrados.len());
        encontrados[desde..hasta].to_vec()
    }
}
