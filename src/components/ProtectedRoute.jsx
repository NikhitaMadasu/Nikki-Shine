
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getCurrentUser } from "../utils/storage";

export default function ProtectedRoute({
  adminOnly = false,
}) {
  const user = getCurrentUser();
  const location = useLocation();

  // No login: redirect to login page
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          message: "Please log in to access this page.",
        }}
      />
    );
  }

  // Only admin can open the admin dashboard
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Admin should not access customer-only pages
  if (!adminOnly && user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
