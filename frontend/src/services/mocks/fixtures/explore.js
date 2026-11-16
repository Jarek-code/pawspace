/**
 * Fixtures de exploración y búsqueda. Sin geolocalización ni distancia:
 * database/schema.sql no guarda ubicación de la mascota.
 */

export const exploreTrends = [
  { tag: '#gatosdelsol', count: '1.2 mil publicaciones' },
  { tag: '#siestas', count: '986 publicaciones' },
  { tag: '#perrosfelices', count: '754 publicaciones' },
  { tag: '#adopta', count: '512 publicaciones' },
  { tag: '#conejos', count: '218 publicaciones' },
];

export const exploreCategories = [
  { value: 'Perro', label: 'Perros', icon: 'dog', count: '12.4 mil' },
  { value: 'Gato', label: 'Gatos', icon: 'cat', count: '9.8 mil' },
  { value: 'Ave', label: 'Aves', icon: 'bird', count: '2.1 mil' },
  { value: 'Conejo', label: 'Conejos', icon: 'rabbit', count: '1.4 mil' },
  { value: 'Pez', label: 'Peces', icon: 'fish', count: '860' },
  { value: 'Tortuga', label: 'Tortugas', icon: 'turtle', count: '410' },
];

export const suggestedPets = ['@milo', '@nala', '@kira', '@toby'];

export const defaultRecentSearches = ['gatos siameses', '#adopta', 'golden retriever'];

export const sortOptions = [
  { value: 'relevancia', label: 'Relevancia' },
  { value: 'recientes', label: 'Más recientes' },
];
