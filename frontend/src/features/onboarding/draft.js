const DRAFT_KEY = 'pawspace.onboarding.draft';
const PENDING_KEY = 'pawspace.onboarding.pendingPet';

let photoFile = null;
let photoPreviewUrl = '';

function read(key) {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento, el borrador dura lo que la pantalla actual.
  }
}

function remove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Nada que limpiar.
  }
}

export function getDraft() {
  return read(DRAFT_KEY) || {};
}

export function saveDraft(patch) {
  const next = { ...getDraft(), ...patch };
  write(DRAFT_KEY, next);
  return next;
}

export function clearDraft() {
  remove(DRAFT_KEY);
  clearPhoto();
}

export function setPhoto(file) {
  clearPhoto();
  photoFile = file || null;
  photoPreviewUrl = file ? URL.createObjectURL(file) : '';
}

export function getPhoto() {
  return { file: photoFile, previewUrl: photoPreviewUrl };
}

export function clearPhoto() {
  if (photoPreviewUrl) {
    URL.revokeObjectURL(photoPreviewUrl);
  }

  photoFile = null;
  photoPreviewUrl = '';
}

export function setPendingPet(pet) {
  write(PENDING_KEY, pet);
}

export function getPendingPet() {
  return read(PENDING_KEY);
}

export function clearPendingPet() {
  remove(PENDING_KEY);
}
