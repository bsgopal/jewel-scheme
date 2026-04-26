import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, roles = [] }) {
  const token = localStorage.getItem("token");
  const isGuest = localStorage.getItem("isGuest");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const location = useLocation();

  if (!token && !isGuest) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (roles.length && !isGuest && !roles.map((item) => item.toLowerCase()).includes(role)) {
    return <Navigate to="/Home" replace state={{ from: location }} />;
  }

  return children;
}
