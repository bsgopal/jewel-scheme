import { Navigate, useLocation } from "react-router-dom";
import { getStoredRole, hasRequiredRole } from "../../utils/permissions";
import { getDefaultRoute } from "../../utils/navigation";

export default function ProtectedRoute({ children, roles = [] }) {
  const token = localStorage.getItem("token");
  const isGuest = localStorage.getItem("isGuest");
  const role = getStoredRole();
  const location = useLocation();
  const defaultRoute = getDefaultRoute({ role, isGuest: isGuest === "true", hasToken: Boolean(token) });

  if (!token && !isGuest) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles.length && !isGuest && !hasRequiredRole(roles, role)) {
    return <Navigate to={defaultRoute} replace state={{ from: location }} />;
  }

  return children;
}
