import { Link, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute({ admin = false }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="loading-state">Checking your session...</div>;
  if (!user) return <Navigate replace to="/login" />;
  if (admin && user.role !== "admin") return <section className="page-wrap"><div className="empty-state"><h1>Access denied</h1><p>You do not have administrator permissions to view this area.</p><Link className="button primary" to="/">Return to overview</Link></div></section>;
  return <Outlet />;
}

export default ProtectedRoute;
