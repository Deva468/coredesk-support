import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute({ admin = false }) {
  const { user } = useAuth();
  const location = useLocation();

  // Still checking auth status (getCurrentUser() hasn't resolved yet)
  // user is undefined at the very start (per AuthContext.jsx)
  if (user === undefined) {
    return (
      <div className="route-loading">
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in at all -> send to login, remember where they came from
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Route requires admin, but this user isn't admin -> block, send home
  if (admin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Passed all checks -> render the actual protected page
  return <Outlet />;
}

export default ProtectedRoute;