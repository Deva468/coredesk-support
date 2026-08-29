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
        <span className="brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 5.5v6c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5v-6L12 2z" fill="#e87e47" />
            <path d="M12 6a3.5 3.5 0 0 0-3.5 3.5v2.2a1.8 1.8 0 0 0 1.8 1.8h.5v-3.6h-1.3v-.4a2.5 2.5 0 0 1 5 0v.4h-1.3v3.6h.5a1.8 1.8 0 0 0 1.8-1.8V9.5A3.5 3.5 0 0 0 12 6z" fill="#ffffff" />
            <circle cx="12" cy="17" r="1.3" fill="#ffffff" />
          </svg>
        </span>
        <span><strong>CoreDesk</strong><small>IT Service Desk</small></span>
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
      <Link className="sidebar-help" to="/help" aria-label="Browse the knowledge base"><span className="help-dot">?</span><div><strong>Need a hand?</strong><small>Browse the knowledge base</small></div></Link>
      {user ? <div className="user-profile"><Link className="avatar" to="/settings">{user.name.slice(0, 2).toUpperCase()}</Link><div><Link to="/settings"><strong>{user.name}</strong><small>{user.role === "admin" ? "Administrator" : user.email}</small></Link></div><button className="signout" onClick={signOut}>↪</button></div> : <Link className="nav-link" to="/login"><span className="nav-icon">→</span>Sign in</Link>}
    </aside>
  );
}

export default Navbar;
