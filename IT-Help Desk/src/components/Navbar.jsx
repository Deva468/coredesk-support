import { Link, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Navbar() {
  const { user, signOut } = useAuth();
  const navItems = [
    { to: "/", label: "Overview", icon: "▦" },
    { to: "/tickets", label: "All tickets", icon: "≡" },
    { to: "/add", label: "New request", icon: "+" },
  ];

  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-mark">+</span>
        <span><strong>Nexora</strong><small>Service desk</small></span>
      </Link>
      <div className="nav-section">
        <span className="nav-label">Workspace</span>
        {navItems.map((item) => (
          <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} end={item.to === "/"} key={item.to} to={item.to}>
            <span className="nav-icon">{item.icon}</span>{item.label}
          </NavLink>
        ))}
        {user?.role === "admin" && <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/admin"><span className="nav-icon">✓</span>Admin panel</NavLink>}
      </div>
      <div className="sidebar-help"><span className="help-dot">?</span><div><strong>Need a hand?</strong><small>Browse the knowledge base</small></div></div>
      {user ? <div className="user-profile"><Link className="avatar" to="/settings">{user.name.slice(0, 2).toUpperCase()}</Link><div><Link to="/settings"><strong>{user.name}</strong><small>{user.role === "admin" ? "Administrator" : user.email}</small></Link></div><button className="signout" onClick={signOut}>↪</button></div> : <Link className="nav-link" to="/login"><span className="nav-icon">→</span>Sign in</Link>}
    </aside>
  );
}

export default Navbar;
