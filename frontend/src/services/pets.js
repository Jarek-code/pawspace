import { currentSession } from '@/services/auth.js';
import { getActivePet, setActivePet as persistActivePet } from '@/lib/storage.js';

const PETS_KEY = 'pawspace.pets';
const SEED_OWNER = 'sofia.ramirez@example.com';

const seedPets = [
  {
    id: 'pet_luna',
    propietario: SEED_OWNER,
    nombre: 'Luna',
    usuario: 'luna.paws',
    especie: 'Gato',
    raza: 'Siamés',
    sexo: 'Hembra',
    fechaNacimiento: '2020-05-12',
    bio: 'Curiosa, tranquila y muy independiente.',
    privacidad: 'publico',
    avatar: null,
  },
  {
    id: 'pet_tobias',
    propietario: SEED_OWNER,
    nombre: 'Tobias',
    usuario: 'tobias.golden',
    especie: 'Perro',
    raza: 'Golden retriever',
    sexo: 'Macho',
    fechaNacimiento: '2019-09-03',
    bio: 'Loyal, activo y siempre con hambre.',
    privacidad: 'publico',
    avatar: null,
  },
];

function readAll() {
  try {
    const value = localStorage.getItem(PETS_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeAll(pets) {
  try {
    localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  } catch {
    // Sin almacenamiento, las mascotas duran lo que la pestaña.
  }
}

function ensureSeed() {
  const current = readAll();

  if (current) {
    return current;
  }

  writeAll(seedPets);
  return seedPets;
}

function handleFrom(name) {
  return String(name || 'mascota')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 30);
}

export function listPets(email = currentSession().email) {
  if (!email) {
    return [];
  }

  return ensureSeed().filter((pet) => pet.propietario === email);
}

export function createPet(email, data) {
  const pets = ensureSeed();
  const base = data.usuario || handleFrom(data.nombre);
  let usuario = base;
  let suffix = 2;

  while (pets.some((pet) => pet.usuario === usuario)) {
    usuario = `${base}${suffix}`;
    suffix += 1;
  }

  const pet = {
    id: `pet_${Date.now()}`,
    propietario: email,
    nombre: data.nombre.trim(),
    usuario,
    especie: data.especie || '',
    raza: data.raza || '',
    sexo: data.sexo || '',
    fechaNacimiento: data.fechaNacimiento || '',
    bio: data.bio || '',
    privacidad: data.privacidad || 'publico',
    avatar: null,
  };

  pets.push(pet);
  writeAll(pets);
  return pet;
}

export function activatePet(pet) {
  persistActivePet(pet);
  return pet;
}

export function getCurrentPet() {
  return getActivePet();
}
