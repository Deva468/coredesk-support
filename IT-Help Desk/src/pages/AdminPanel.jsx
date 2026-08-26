import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getToken } from "../utils/authStore";

function AdminPanel() {
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [note, setNote] = useState({});
  const [error, setError] = useState("");

  async function load() {
    const headers = { Authorization: `Bearer ${getToken()}` };
    const responses = await Promise.all([
      fetch("/api/tickets", { headers }),
      fetch("/api/admin/activity", { headers }),
      fetch("/api/admin/users", { headers }),
    ]);
    const data = await Promise.all(responses.map((response) => response.json()));
    if (responses.some((response) => !response.ok)) throw new Error(data.find((item, index) => !responses[index].ok)?.message || "Unable to load admin data");
    setTickets(data[0]);
    setActivities(data[1]);
    setUsers(data[2].users);
  }

  useEffect(() => {
    const timer = setTimeout(() => load().catch((err) => setError(err.message)), 0);
    return () => clearTimeout(timer);
  }, []);

  async function resolve(id) {
    const response = await fetch(`/api/tickets/${id}/resolve`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }, body: JSON.stringify({ resolutionNote: note[id] || "Resolved by the support team" }) });
    if (!response.ok) { const data = await response.json(); setError(data.message); return; }
    await load();
  }

  const active = tickets.filter((ticket) => ticket.status === "Open");
  const historical = tickets.filter((ticket) => ticket.status !== "Open");
  const formatDate = (value) => value ? new Date(value).toLocaleString() : "Not recorded";

  return <div className="page-wrap">
    <header className="page-header"><div><span className="eyebrow">ADMINISTRATION / OPERATIONS</span><h1>Request management</h1><p>Review active requests and keep resolution history auditable.</p></div><Link className="back-link" to="/">← Back to overview</Link></header>
    <section className="stats-grid"><div className="stat-card accent"><div><span className="stat-label">Registered employees</span><strong>{users.length}</strong><small>{users.filter((user) => user.isActive).length} currently active</small></div></div><div className="stat-card"><div><span className="stat-label">Active requests</span><strong>{active.length}</strong><small>Awaiting resolution</small></div></div><div className="stat-card"><div><span className="stat-label">Historical records</span><strong>{historical.length}</strong><small>Resolved or removed</small></div></div></section>
    {error && <p className="error-state">{error}</p>}
    <section className="panel ticket-panel"><div className="panel-heading"><div><span className="eyebrow">EMPLOYEE DIRECTORY</span><h2>Registered employees</h2></div></div><table><thead><tr><th>Employee</th><th>Department</th><th>Role</th><th>Created</th><th>Last login</th><th>State</th></tr></thead><tbody>{users.map((user) => <tr key={user._id}><td>{user.name}<br /><small>{user.email}</small></td><td>{user.department}</td><td>{user.role}</td><td>{formatDate(user.createdAt)}</td><td>{formatDate(user.lastLoginAt)}</td><td>{user.isActive ? "Active" : "Offline"}</td></tr>)}</tbody></table></section>
    <section className="panel ticket-panel"><div className="panel-heading"><div><span className="eyebrow">ACTIVE QUEUE</span><h2>Requests needing attention</h2></div></div>{active.length === 0 ? <div className="empty-state">No active requests. The queue is clear.</div> : <div className="admin-list">{active.map((ticket) => <article className="admin-row" key={ticket._id}><div><strong>{ticket.title || ticket.issue}</strong><small>{ticket.name} · {ticket.email} · {ticket.department} · submitted {formatDate(ticket.submittedAt)}</small><span className={`priority ${String(ticket.priority || "Low").toLowerCase()}`}>{ticket.priority}</span></div><div className="admin-action"><input placeholder="Resolution note (optional)" value={note[ticket._id] || ""} onChange={(event) => setNote({ ...note, [ticket._id]: event.target.value })} /><button className="button primary" onClick={() => resolve(ticket._id)}>Mark resolved</button></div></article>)}</div>}</section>
    <section className="panel ticket-panel"><div className="panel-heading"><div><span className="eyebrow">TICKET HISTORY</span><h2>Resolved and removed requests</h2></div></div>{historical.length === 0 ? <div className="empty-state">No historical requests yet.</div> : <table><thead><tr><th>Request</th><th>Employee</th><th>Status</th><th>Submitted</th><th>Updated</th><th>Resolver / remover</th><th>Details</th></tr></thead><tbody>{historical.map((ticket) => <tr key={ticket._id}><td><strong>{ticket.title || ticket.issue}</strong><br /><small>{ticket.requestType || "General support"} · {ticket.priority}</small></td><td>{ticket.name}<br /><small>{ticket.email}</small></td><td>{ticket.status}</td><td>{formatDate(ticket.submittedAt)}</td><td>{formatDate(ticket.updatedAt)}</td><td>{ticket.status === "Removed" ? ticket.removerName : ticket.resolverName}<br /><small>{ticket.status === "Removed" ? ticket.removerEmail : ticket.resolverEmail}</small></td><td>{ticket.status === "Removed" ? "Removed from active queue" : ticket.resolutionNote || "No note"}</td></tr>)}</tbody></table>}</section>
    <section className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">AUDIT LOG</span><h2>User activity</h2></div></div>{activities.length === 0 ? <div className="empty-state">No activity recorded yet.</div> : <div className="admin-list">{activities.map((activity) => <article className="admin-row" key={activity._id}><div><strong>{activity.action.replaceAll("_", " ")}</strong><small>{activity.email} · {formatDate(activity.createdAt)}</small></div></article>)}</div>}</section>
  </div>;
}

export default AdminPanel;
