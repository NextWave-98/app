import type { User } from '../context/AuthContext';

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, permissionName: string): boolean => {
  if (!user || !user.role?.permissions) {
    return false;
  }

  return user.role.permissions.some((perm) => perm.name === permissionName);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissionNames: string[]): boolean => {
  if (!user || !user.role?.permissions) {
    return false;
  }

  return permissionNames.some((permName) =>
    user.role.permissions.some((perm) => perm.name === permName)
  );
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissionNames: string[]): boolean => {
  if (!user || !user.role?.permissions) {
    return false;
  }

  return permissionNames.every((permName) =>
    user.role.permissions.some((perm) => perm.name === permName)
  );
};

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, roleName: string): boolean => {
  if (!user || !user.role?.name) {
    return false;
  }

  return user.role.name.toUpperCase() === roleName.toUpperCase();
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roleNames: string[]): boolean => {
  if (!user || !user.role?.name) {
    return false;
  }

  const userRole = user.role.name.toUpperCase();
  return roleNames.some((role) => role.toUpperCase() === userRole);
};

/**
 * Check if user is admin (ADMIN or SUPERADMIN)
 */
export const isAdmin = (user: User | null): boolean => {
  return hasAnyRole(user, ['ADMIN', 'SUPERADMIN']);
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return hasRole(user, 'ADMIN') || hasRole(user, 'SUPERADMIN');
};

/**
 * Check if user is branch manager
 */
export const isBranchManager = (user: User | null): boolean => {
  return hasRole(user, 'MANAGER');
};

