import { describe, expect, it } from 'vitest';
import { breedsForSpecies, BREEDS_BY_SPECIES } from '@/features/onboarding/breeds.js';

describe('breedsForSpecies', () => {
  it('devuelve las razas de una especie registrada', () => {
    expect(breedsForSpecies('Gato')).toEqual([
      { value: 'Siamés', label: 'Siamés' },
      { value: 'Persa', label: 'Persa' },
      { value: 'Común Europeo', label: 'Común Europeo' },
    ]);
  });

  it('devuelve lista vacía para una especie sin razas', () => {
    expect(breedsForSpecies('Cobayo')).toEqual([]);
    expect(breedsForSpecies('Hámster')).toEqual([]);
  });

  it('devuelve lista vacía para un valor desconocido o vacío', () => {
    expect(breedsForSpecies('')).toEqual([]);
    expect(breedsForSpecies('Dragón')).toEqual([]);
  });

  it('expone solo las especies que tienen razas en la base de datos', () => {
    expect(Object.keys(BREEDS_BY_SPECIES).sort()).toEqual(['Ave', 'Conejo', 'Gato', 'Perro']);
  });
});
