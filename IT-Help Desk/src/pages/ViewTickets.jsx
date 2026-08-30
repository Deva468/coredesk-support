import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getTickets } from "../utils/ticketStore";

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <div className="skeleton-row" key={i}>
      <div className="skeleton skeleton-avatar" />
      <div className="skeleton-text">
        <div className="skeleton skeleton-line w-60" />
        <div className="skeleton skeleton-line w-40" />
      </div>
      <div className="skeleton skeleton-line w-15" style={{ height: 22 }} />
      <div className="skeleton skeleton-line w-15" style={{ height: 22 }} />
    </div>
  ));
}

function ViewTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const [searchParams] = useSearchParams();

  // Apply URL query params to initial filter values
  useEffect(() => {
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    if (priority && ["Low", "Medium", "High"].includes(priority)) setPriorityFilter(priority);
    if (status && ["Open", "Resolved", "Removed"].includes(status)) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    async function loadTickets() {
      try {
        const data = await getTickets();
        if (!ignore) { setTickets(Array.isArray(data) ? data : []); setError(""); }
      } catch (err) {
        if (!ignore) setError(err.message || "Could not load tickets. Please try again.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadTickets();
    return () => { ignore = true; };
  }, []);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const deps = [...new Set(tickets.map((t) => t.department).filter(Boolean))].sort();
    return deps;
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tickets.filter((ticket) => {
      if (statusFilter !== "All" && (ticket.status || "Open") !== statusFilter) return false;
      if (priorityFilter !== "All" && (ticket.priority || "Low") !== priorityFilter) return false;
      if (deptFilter !== "All" && ticket.department !== deptFilter) return false;
      if (q) {
        const haystack = [ticket.title, ticket.issue, ticket.name, ticket.department]
          .map((v) => String(v || "").toLowerCase());
        if (!haystack.some((h) => h.includes(q))) return false;
      }
      return true;
    });
  }, [tickets, search, statusFilter, priorityFilter, deptFilter]);

  const hasActiveFilter = statusFilter !== "All" || priorityFilter !== "All" || deptFilter !== "All" || search;

  function clearFilters() {
    setSearch(""); setStatusFilter("All"); setPriorityFilter("All"); setDeptFilter("All");
  }

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">WORKSPACE / REQUESTS</span>
          <h1>All requests</h1>
          <p>Track, triage, and resolve every request in one place.</p>
        </div>
        <Link className="button primary" to="/add"><span>+</span> Create request</Link>
      </header>

      <section className="panel ticket-panel">
        {/* ── Toolbar ── */}
        <div className="ticket-toolbar">
          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search requests by title, issue, name or department"
              placeholder="Search requests…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:16, padding:"0 4px" }}
              >×</button>
            )}
          </div>

          {/* Filter row */}
          <div className="ticket-filters" role="group" aria-label="Filter controls">
            <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All statuses</option>
              <option value="Open">Open</option>
              <option value="Resolved">Resolved</option>
              <option value="Removed">Removed</option>
            </select>
            <select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="All">All priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select aria-label="Filter by department" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="All">All departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {hasActiveFilter && (
              <button type="button" className="button" onClick={clearFilters} style={{ padding:"8px 11px", fontSize:11 }}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── States ── */}
        {loading && (
          <div style={{ padding:"0 0 8px" }}>
            <SkeletonRows />
          </div>
        )}
        {!loading && error && (
          <div className="empty-state" style={{ color:"#c85a43" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>⚠</div>
            <strong>Something went wrong</strong>
            <p style={{ margin:"6px 0 0", fontSize:12 }}>{error}</p>
          </div>
        )}
        {!loading && !error && tickets.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize:36, marginBottom:10 }}>📭</div>
            <strong>No requests yet</strong>
            <p style={{ margin:"6px 0 0", fontSize:12, color:"var(--muted)" }}>
              Create your first support request to get the queue moving.
            </p>
            <Link to="/add" className="button primary" style={{ marginTop:16, display:"inline-flex" }}>
              <span>+</span> Create request
            </Link>
          </div>
        )}
        {!loading && !error && tickets.length > 0 && filteredTickets.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
            <strong>No matches</strong>
            <p style={{ margin:"6px 0 0", fontSize:12, color:"var(--muted)" }}>
              No requests match your current filters.{" "}
              <button type="button" onClick={clearFilters} style={{ background:"none", border:"none", color:"var(--teal)", cursor:"pointer", fontWeight:700, padding:0, font:"inherit", fontSize:12 }}>
                Clear filters
              </button>
            </p>
          </div>
        )}

        {/* ── Table (wraps into cards on mobile via CSS) ── */}
        {!loading && filteredTickets.length > 0 && (
          <div className="ticket-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Requester</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td>
                      <div className="request-cell">
                        <span className="request-icon" aria-hidden="true">↗</span>
                        <strong>{ticket.title || ticket.issue}</strong>
                      </div>
                    </td>
                    <td data-label="Requester">{ticket.name}</td>
                    <td data-label="Department">{ticket.department}</td>
                    <td data-label="Priority">
                      <span className={`priority ${String(ticket.priority || "Low").toLowerCase()}`}>
                        {ticket.priority || "Low"}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className="status-dot"><i></i>{ticket.status || "Open"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Results count */}
        {!loading && filteredTickets.length > 0 && (
          <p style={{ color:"var(--muted)", fontSize:11, marginTop:14, textAlign:"right" }}>
            Showing {filteredTickets.length} of {tickets.length} request{tickets.length !== 1 ? "s" : ""}
          </p>
        )}
      </section>
    </div>
  );
}

export default ViewTickets;
