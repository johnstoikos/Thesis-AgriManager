export function getUserRoles(user) {
  const roles = user?.roles || user?.role || [];
  return Array.isArray(roles) ? roles : [roles];
}

export function getHomePath(user) {
  return getUserRoles(user).includes("ROLE_ADMIN") ? "/admin/dashboard" : "/dashboard";
}
