import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute({ admin = false }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="loading-state">Checking your session...</div>;
  if (!user) return <Navigate replace to="/login" />;
  if (admin && user.role !== "admin") return <Navigate replace to="/" />;
  return <Outlet />;
}

export default ProtectedRoute;
