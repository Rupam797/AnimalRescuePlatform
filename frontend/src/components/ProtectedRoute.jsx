import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="status-spinner" style={{ margin: "0 auto 12px" }}></div>
          <p style={{ color: "#5d7367", fontSize: "14px" }}>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // If volunteer tries admin, or user tries admin, redirect to their role home
    if (user?.role === "ROLE_ADMIN") {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === "ROLE_VOLUNTEER") {
      return <Navigate to="/volunteer" replace />;
    } else {
      return <Navigate to="/my-reports" replace />;
    }
  }

  return children;
}
