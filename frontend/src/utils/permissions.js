const normalizeRoleValue = (value) => (value || "").toString().trim().toLowerCase();

export const getStoredRole = () => normalizeRoleValue(localStorage.getItem("role"));

export const isAdminLike = (role = getStoredRole()) => {
  const normalizedRole = normalizeRoleValue(role);
  return normalizedRole === "admin" || normalizedRole === "staff";
};

export const hasRequiredRole = (allowedRoles = [], role = getStoredRole()) => {
  if (!allowedRoles.length) return true;

  const normalizedRole = normalizeRoleValue(role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRoleValue);

  return normalizedAllowedRoles.includes(normalizedRole);
};
