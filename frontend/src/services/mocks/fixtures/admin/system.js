// Sistema y actividad del panel de administración.

export const adminSystem = {
  estado: 'operativo',
  title: 'Todo operativo',
  checked: '10:42',
};

export const adminActivity = [
  { hora: '10:42', texto: 'Mariana resolvió el reporte #1040' },
  { hora: '10:18', texto: 'Mariana respondió el ticket #2051' },
  { hora: '09:54', texto: 'Nuevo reporte sobre @kira' },
  { hora: '09:31', texto: 'Apelación aceptada: #1022' },
];

/**
 * Cuentas para la sección Usuarios. Reutiliza los handles de las mascotas del
 * feed para que la moderación y la ficha sean coherentes con el resto de la
 * demo. `eliminada` deja la cuenta en solo lectura.
 */
