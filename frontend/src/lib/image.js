/**
 * Utilidades de imagen para los mocks.
 * Redimensiona la foto de perfil para que quepa en localStorage sin guardar
 * archivos grandes ni exponer el archivo original.
 */
export async function fileToDataUrl(file, { maxDimension = 800, quality = 0.85 } = {}) {
  if (!file) {
    return '';
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return canvas.toDataURL('image/jpeg', quality);
}
