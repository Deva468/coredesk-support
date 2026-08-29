import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { useAuth } from "../components/AuthContext";
import { getToken } from "../utils/authStore";

function AdminPanel() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [note, setNote] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [error, setError] = useState("");

  function headers(json = false) {
    return {
      ...(json ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${getToken()}`,
    };
  }

  const load = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/tickets`, { headers: headers() }),
        fetch(`${API_BASE_URL}/admin/activity`, { headers: headers() }),
        fetch(`${API_BASE_URL}/admin/users`, { headers: headers() }),
      ]);
      const data = await Promise.all(responses.map((response) => response.json().catch(() => ({}))));
      if (responses.some((response) => !response.ok)) {
        const failed = data.find((item, index) => !responses[index].ok);
        throw new Error(failed?.message || "Unable to load admin data");
      }
      setTickets(Array.isArray(data[0]) ? data[0] : []);
      setActivities(Array.isArray(data[1]) ? data[1] : []);
      const usersList = Array.isArray(data[2]?.users) ? data[2].users : (Array.isArray(data[2]) ? data[2] : []);
      setUsers(usersList);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load admin operations data");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function resolve(id) {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}/resolve`, {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify({ resolutionNote: note[id] || "Resolved by the support team" }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Failed to resolve ticket");
      return;
    }
    await load();
  }

  async function assign(id, resolverId) {
    if (!resolverId) return;
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}/assign`, {
      method: "PATCH",
      headers: headers(true),
      body: JSON.stringify({ resolverId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Failed to assign resolver");
      return;
    }
    await load();
  }

  async function promoteUser(id) {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}/promote`, {
      method: "PATCH",
      headers: headers(true),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.message || "Unable to promote user");
      return;
    }
    setError("");
    await load();
  }

  async function remove(id) {
    if (!window.confirm("Remove this request from the active queue?")) return;
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Failed to remove ticket");
      return;
    }
    await load();
  }

  async function showDetails(id) {
    const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}`, { headers: headers() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.message || "Failed to load ticket details");
      return;
    }
    setSelectedTicket(data.ticket);
  }

  const active = tickets.filter((ticket) => ticket.status === "Open");
  const historical = tickets.filter((ticket) => ticket.status !== "Open");
  const formatDate = (value) => (value ? new Date(value).toLocaleString() : "Not recorded");

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">ADMINISTRATION / OPERATIONS</span>
          <h1>Request management</h1>
          <p>Review active requests and keep resolution history auditable.</p>
        </div>
        <Link className="back-link" to="/">← Back to overview</Link>
      </header>

      <section className="stats-grid">
        <div className="stat-card accent">
          <div>
            <span className="stat-label">Registered employees</span>
            <strong>{users.length}</strong>
            <small>{users.filter((u) => u.isActive).length} currently active</small>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <span className="stat-label">Active requests</span>
            <strong>{active.length}</strong>
            <small>Awaiting resolution</small>
          </div>
        </div>
        <div className="stat-card">
          <div>
            <span className="stat-label">Historical records</span>
            <strong>{historical.length}</strong>
            <small>Resolved or removed</small>
          </div>
        </div>
      </section>

      {error && <p className="error-state">{error}</p>}

      <section className="panel ticket-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">EMPLOYEE DIRECTORY</span>
            <h2>Registered employees</h2>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Role</th>
              <th>Created</th>
              <th>Last login</th>
              <th>State</th>
              {user?.role === "admin" && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((userItem) => (
              <tr key={userItem._id}>
                <td>
                  <strong>{userItem.name}</strong>
                  <br />
                  <small>{userItem.email}</small>
                </td>
                <td>{userItem.department}</td>
                <td>
                  <span className={`priority ${userItem.role === "admin" ? "high" : "low"}`}>
                    {userItem.role}
                  </span>
                </td>
                <td>{formatDate(userItem.createdAt)}</td>
                <td>{formatDate(userItem.lastLoginAt)}</td>
                <td>{userItem.isActive ? "Active" : "Offline"}</td>
                {user?.role === "admin" && (
                  <td>
                    {userItem.role === "admin" ? (
                      <span className="field-hint" style={{ float: "none", color: "var(--teal)", fontWeight: "600" }}>
                        Admin
                      </span>
                    ) : (
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => promoteUser(userItem._id)}
                      >
                        Make Admin
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel ticket-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ACTIVE QUEUE</span>
            <h2>Requests needing attention</h2>
          </div>
        </div>
        {active.length === 0 ? (
          <div className="empty-state">No active requests. The queue is clear.</div>
        ) : (
          <div className="admin-list">
            {active.map((ticket) => (
              <article className="admin-row" key={ticket._id}>
                <div>
                  <strong>{ticket.title || ticket.issue}</strong>
                  <small>
                    {ticket.name} · {ticket.email} · {ticket.department} · submitted {formatDate(ticket.submittedAt)}
                  </small>
                  <span className={`priority ${String(ticket.priority || "Low").toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                  <small>Assigned to: {ticket.assignedToName || "Unassigned"}</small>
                </div>
                <div className="admin-action">
                  <select
                    aria-label={`Assign ${ticket.title || ticket.issue}`}
                    value={ticket.assignedTo?._id || ticket.assignedTo || ""}
                    onChange={(event) => assign(ticket._id, event.target.value)}
                  >
                    <option value="">Assign resolver</option>
                    {users
                      .filter((u) => u.role === "admin")
                      .map((adminUser) => (
                        <option key={adminUser._id} value={adminUser._id}>
                          {adminUser.name}
                        </option>
                      ))}
                  </select>
                  <input
                    placeholder="Resolution note (optional)"
                    value={note[ticket._id] || ""}
                    onChange={(event) => setNote({ ...note, [ticket._id]: event.target.value })}
                  />
                  <button className="button" onClick={() => showDetails(ticket._id)}>Details</button>
                  <button className="button primary" onClick={() => resolve(ticket._id)}>Resolve</button>
                  <button className="button" onClick={() => remove(ticket._id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel ticket-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">TICKET HISTORY</span>
            <h2>Resolved and removed requests</h2>
          </div>
        </div>
        {historical.length === 0 ? (
          <div className="empty-state">No historical requests yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Updated</th>
                <th>Resolver / remover</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {historical.map((ticket) => (
                <tr key={ticket._id}>
                  <td>
                    <strong>{ticket.title || ticket.issue}</strong>
                    <br />
                    <small>{ticket.requestType || "General support"} · {ticket.priority}</small>
                  </td>
                  <td>
                    {ticket.name}
                    <br />
                    <small>{ticket.email}</small>
                  </td>
                  <td>{ticket.status}</td>
                  <td>{formatDate(ticket.submittedAt)}</td>
                  <td>{formatDate(ticket.updatedAt)}</td>
                  <td>
                    {ticket.status === "Removed" ? ticket.removerName : ticket.resolverName}
                    <br />
                    <small>{ticket.status === "Removed" ? ticket.removerEmail : ticket.resolverEmail}</small>
                  </td>
                  <td>{ticket.status === "Removed" ? "Removed from active queue" : ticket.resolutionNote || "No note"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel activity-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">AUDIT LOG</span>
            <h2>User activity</h2>
          </div>
        </div>
        {activities.length === 0 ? (
          <div className="empty-state">No activity recorded yet.</div>
        ) : (
          <div className="admin-list">
            {activities.map((activity) => (
              <article className="admin-row" key={activity._id}>
                <div>
                  <strong>{activity.action.replaceAll("_", " ")}</strong>
                  <small>{activity.email} · {formatDate(activity.createdAt)}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedTicket && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedTicket(null)}>
          <section className="panel modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">TICKET DETAILS</span>
                <h2>{selectedTicket.title || selectedTicket.issue}</h2>
              </div>
              <button className="button" onClick={() => setSelectedTicket(null)}>Close</button>
            </div>
            <p>{selectedTicket.issue}</p>
            <p><strong>Requester:</strong> {selectedTicket.name} ({selectedTicket.email})</p>
            <p><strong>Status:</strong> {selectedTicket.status} · <strong>Priority:</strong> {selectedTicket.priority}</p>
            <p><strong>Assigned:</strong> {selectedTicket.assignedToName || "Unassigned"}</p>
            <h3>History</h3>
            {(selectedTicket.history || []).map((entry, index) => (
              <p key={`${entry.changedAt}-${index}`}>
                <small>{formatDate(entry.changedAt)} · {entry.status} · {entry.note}</small>
              </p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
