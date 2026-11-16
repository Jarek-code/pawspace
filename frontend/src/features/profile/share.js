export function profileUrl(profile) {
  const handle = String(profile?.handle || '').replace(/^@/, '');
  return `${window.location.origin}/mascota/${encodeURIComponent(handle)}`;
}

export async function copyProfileUrl(profile) {
  try {
    await navigator.clipboard.writeText(profileUrl(profile));
    return 'copied';
  } catch {
    return 'failed';
  }
}

export async function shareProfile(profile) {
  const url = profileUrl(profile);

  if (navigator.share) {
    try {
      await navigator.share({ title: `Perfil de ${profile.nombre}`, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') {
        return 'cancelled';
      }
    }
  }

  return copyProfileUrl(profile);
}
