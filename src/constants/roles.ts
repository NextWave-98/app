export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  MANAGER: 3,
  USER: 4,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_NAMES: Record<RoleId, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'MANAGER',
  [ROLES.USER]: 'User',
};

export const getRoleName = (roleId: number): string => {
  return ROLE_NAMES[roleId as RoleId] || 'Unknown';
};
