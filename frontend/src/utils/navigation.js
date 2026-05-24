import { getStoredRole } from "./permissions";

export const getCurrentRoute = (location) => {
  if (!location) return "/";
  return `${location.pathname || ""}${location.search || ""}${location.hash || ""}` || "/";
};

export const getBackTarget = (location, fallback = "/Home") => {
  return location?.state?.backTo || fallback;
};

export const getDefaultRoute = (options = {}) => {
  const hasToken = options.hasToken ?? Boolean(localStorage.getItem("token"));
  const isGuest = options.isGuest ?? localStorage.getItem("isGuest") === "true";
  const role = (options.role ?? getStoredRole() ?? "").toLowerCase();

  if (!hasToken && !isGuest) return "/";
  if (role === "agent") return "/agent-dashboard";
  return "/Home";
};

export const buildBackState = (location, extraState = {}) => ({
  ...extraState,
  backTo: getCurrentRoute(location),
});

/**
 * Enhanced back navigation with professional flow
 * Matches Malabar Gold app navigation standards
 */
export const goBackOrFallback = (navigate, location, fallback = getDefaultRoute(), options = {}) => {
  const currentRoute = getCurrentRoute(location);
  const preferredTarget = location?.state?.backTo;

  // If we have a stored back target and it's different from current route, use it
  if (preferredTarget && preferredTarget !== currentRoute) {
    navigate(preferredTarget, { replace: options.replace ?? false });
    return;
  }

  // Try to use browser history if available
  if (typeof window !== "undefined" && window.history.length > 1) {
    navigate(-1);
    return;
  }

  // Fallback to default route
  navigate(fallback, { replace: options.replace ?? true });
};

/**
 * Create navigation state with back target
 * Use this when navigating to detail pages
 */
export const createNavigationState = (currentLocation, additionalState = {}) => {
  return {
    ...additionalState,
    backTo: getCurrentRoute(currentLocation),
  };
};

/**
 * Get safe back navigation path
 * Prevents navigation loops and invalid routes
 */
export const getSafeBackPath = (location, validRoutes = []) => {
  const backTarget = getBackTarget(location);
  
  // If no valid routes specified, return the back target
  if (!validRoutes.length) return backTarget;
  
  // Check if back target is in valid routes
  if (validRoutes.some(route => backTarget.includes(route))) {
    return backTarget;
  }
  
  // Return first valid route as fallback
  return validRoutes[0] || getDefaultRoute();
};
