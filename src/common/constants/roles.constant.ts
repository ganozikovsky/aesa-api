export const VALID_ROLES = ['OWNER', 'ADMIN', 'EMP'] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export const ROLE_DESCRIPTIONS = {
  OWNER: 'Propietario - Acceso total',
  ADMIN: 'Administrador - Acceso administrativo',
  EMP: 'Empleado - Acceso limitado',
} as const;
