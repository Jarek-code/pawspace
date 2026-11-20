import { ApiError } from '@/lib/errors.js';
import { adminUsers } from '../fixtures/admin/users.js';
import { clone, requireMotivo } from './shared.js';

export const usersState = { users: clone(adminUsers) };

export function resetUsersState() {
  usersState.users = clone(adminUsers);
}

function matchUserQuery(user, q) {
  if (!q) {
    return true;
  }

  const needle = q.toLowerCase();
  return [user.nombre, user.correo, user.handle, user.mascotaNombre]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(needle));
}

export function adminUsersPayload({ filtro = 'todos', q = '', page = 1, pageSize = 8 } = {}) {
  const users = clone(usersState.users);

  const conteos = {
    activos: users.filter((user) => user.activo && !user.eliminada).length,
    suspendidos: users.filter((user) => !user.activo && !user.eliminada).length,
    administradores: users.filter((user) => user.es_admin).length,
    eliminadas: users.filter((user) => user.eliminada).length,
  };

  const filtered = users
    .filter((user) => {
      if (filtro === 'activos') return user.activo && !user.eliminada;
      if (filtro === 'suspendidos') return !user.activo && !user.eliminada;
      if (filtro === 'administradores') return user.es_admin;
      return true;
    })
    .filter((user) => matchUserQuery(user, q));

  const total = filtered.length;
  const pagina = Math.max(1, Number(page) || 1);
  const size = Math.max(1, Number(pageSize) || 8);
  const inicio = (pagina - 1) * size;

  const lista = filtered
    .slice()
    .sort(
      (a, b) => Number(a.eliminada) - Number(b.eliminada) || Number(!a.activo) - Number(!b.activo),
    )
    .slice(inicio, inicio + size)
    .map((user) => ({
      ...user,
      estado: user.eliminada ? 'ELIMINADA' : user.activo ? 'ACTIVA' : 'SUSPENDIDA',
    }));

  return { usuarios: lista, total, pagina, paginaSize: size, conteos };
}

function findAdminUser(id) {
  const user = usersState.users.find((item) => item.id === String(id));

  if (!user) {
    throw new ApiError('No encontramos esa cuenta.', 404, { detail: 'Cuenta inexistente' });
  }

  return user;
}

export function adminUserDetail(id) {
  const user = findAdminUser(id);

  return {
    ...clone(user),
    estado: user.eliminada ? 'ELIMINADA' : user.activo ? 'ACTIVA' : 'SUSPENDIDA',
    mascotas: [{ nombre: user.mascotaNombre, handle: user.handle }],
  };
}

export function suspendAdminUser(id, motivo) {
  const user = findAdminUser(id);

  if (user.eliminada) {
    throw new ApiError('Una cuenta eliminada no se puede suspender.', 409, {
      detail: 'Cuenta eliminada',
    });
  }

  if (user.es_admin) {
    throw new ApiError('No puedes suspender una cuenta administradora.', 409, {
      detail: 'Cuenta administradora',
    });
  }

  const razon = requireMotivo(motivo);

  user.activo = false;
  user.suspension = { motivo: razon, indefinida: true };
  user.actividad = [
    { fecha: 'Ahora', texto: 'La cuenta fue suspendida.' },
    ...(user.actividad || []),
  ];

  return clone(user);
}

export function reactivateAdminUser(id) {
  const user = findAdminUser(id);

  if (user.eliminada) {
    throw new ApiError('Una cuenta eliminada no se puede reactivar.', 409, {
      detail: 'Cuenta eliminada',
    });
  }

  user.activo = true;
  user.suspension = null;
  user.actividad = [
    { fecha: 'Ahora', texto: 'La cuenta fue reactivada.' },
    ...(user.actividad || []),
  ];

  return clone(user);
}
