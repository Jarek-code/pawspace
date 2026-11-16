import { currentSession } from '@/services/auth.js';
import { getActivePet, setActivePet as persistActivePet } from '@/lib/storage.js';

const PETS_KEY = 'pawspace.pets';
const SEED_OWNER = 'sofia.ramirez@example.com';

const seedPets = [
  {
    id: 'pet_luna',
    propietario: SEED_OWNER,
    nombre: 'Luna',
    usuario: 'luna',
    especie: 'Gato',
    raza: 'Siamés',
    sexo: 'Hembra',
    fechaNacimiento: '2022-05-12',
    bio: 'Amante de las siestas al sol y de los tejados. Vivimos juntas desde 2022.',
    privacidad: 'publico',
    avatar: null,
  },
  {
    id: 'pet_tobias',
    propietario: SEED_OWNER,
    nombre: 'Tobias',
    usuario: 'tobias',
    especie: 'Perro',
    raza: 'Golden retriever',
    sexo: 'Macho',
    fechaNacimiento: '2019-09-03',
    bio: 'Leal, activo y siempre con hambre.',
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

const LEGACY_HANDLES = {
  'luna.paws': 'luna',
  'tobias.golden': 'tobias',
};

function migrateHandles(pets) {
  let changed = false;
  const migrated = pets.map((pet) => {
    const next = LEGACY_HANDLES[pet.usuario];

    if (!next) {
      return pet;
    }

    changed = true;
    return { ...pet, usuario: next };
  });

  return { pets: migrated, changed };
}

function ensureSeed() {
  const current = readAll();

  if (!current) {
    writeAll(seedPets);
    return seedPets;
  }

  const { pets, changed } = migrateHandles(current);

  if (changed) {
    writeAll(pets);
  }

  return pets;
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

export function updatePet(id, data) {
  const pets = ensureSeed();
  const index = pets.findIndex((pet) => pet.id === id);

  if (index === -1) {
    return null;
  }

  const allowed = [
    'nombre',
    'usuario',
    'especie',
    'raza',
    'sexo',
    'fechaNacimiento',
    'bio',
    'privacidad',
    'avatar',
  ];
  const next = { ...pets[index] };

  for (const key of allowed) {
    if (data[key] !== undefined) {
      next[key] = data[key];
    }
  }

  const taken = pets.some(
    (pet) => pet.id !== id && pet.usuario.toLowerCase() === next.usuario.toLowerCase(),
  );

  if (taken) {
    throw new Error('Ese nombre de usuario ya está ocupado.');
  }

  pets[index] = next;
  writeAll(pets);

  const active = getActivePet();

  if (active?.id === id) {
    persistActivePet(next);
  }

  return next;
}

export function activatePet(pet) {
  persistActivePet(pet);
  return pet;
}

export function getCurrentPet() {
  const pet = getActivePet();

  if (!pet) {
    return null;
  }

  const legacy = LEGACY_HANDLES[pet.usuario];

  if (legacy) {
    const migrated = { ...pet, usuario: legacy };
    persistActivePet(migrated);
    return migrated;
  }

  return pet;
}
