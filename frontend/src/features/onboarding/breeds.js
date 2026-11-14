/**
 * Catálogo de razas por especie.
 *
 * Espejo de la tabla RAZA de `database/seeds.sql`, con acentos normalizados
 * para la interfaz. No hay endpoint de catálogo todavía, así que este módulo
 * sustituye a la API; cuando exista `GET /razas?especie=…`, se conecta aquí.
 */
export const BREEDS_BY_SPECIES = {
  Perro: ['Labrador Retriever', 'Pastor Alemán', 'Mestizo'],
  Gato: ['Siamés', 'Persa', 'Común Europeo'],
  Conejo: ['Enano'],
  Ave: ['Periquito'],
};

export function breedsForSpecies(especie) {
  return (BREEDS_BY_SPECIES[especie] || []).map((nombre) => ({ value: nombre, label: nombre }));
}
