import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getTickets } from "../utils/ticketStore";

function ViewTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    if (priority && ["Low", "Medium", "High"].includes(priority)) {
      setFilter(priority);
      return;
    }
    if (status && ["Open", "Resolved", "Removed"].includes(status)) {
      setFilter(status);
      return;
    }
    setFilter("All");
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;

    async function loadTickets() {
      try {
        const data = await getTickets();

        if (!ignore) {
          setTickets(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!ignore) {
          console.error(err);
          setError(err.message || "Could not load tickets");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesPriority = filter === "All" || filter === "Open" || filter === "Resolved" || filter === "Removed" || (ticket.priority || "Low") === filter;
    const matchesStatus = (filter === "Open" || filter === "Resolved" || filter === "Removed") ? ((ticket.status || "Open") === filter) : true;
    const query = search.toLowerCase();
    return matchesPriority && matchesStatus && [ticket.name, ticket.department, ticket.issue].some((value) => String(value || "").toLowerCase().includes(query));
  });

  return (
    <div className="page-wrap">
      <header className="page-header"><div><span className="eyebrow">WORKSPACE / REQUESTS</span><h1>All requests</h1><p>Track, triage, and resolve every request in one place.</p></div><Link className="button primary" to="/add"><span>+</span> Create request</Link></header>
      <section className="panel ticket-panel">
        <div className="ticket-toolbar"><div className="search-box"><span>⌕</span><input aria-label="Search requests" placeholder="Search by name, department, or issue" value={search} onChange={(e) => setSearch(e.target.value)} /></div><select aria-label="Filter requests" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="All">All requests</option><option value="Open">Open requests</option><option value="High">High priority</option><option value="Medium">Medium priority</option><option value="Low">Low priority</option><option value="Resolved">Resolved</option></select></div>
        {loading && <p className="loading-state">Loading requests...</p>}
        {error && <p className="error-state">{error}</p>}
        {!loading && tickets.length === 0 && <div className="empty-state">No requests yet. Create the first one to get your queue moving.</div>}
        {!loading && tickets.length > 0 && filteredTickets.length === 0 && <div className="empty-state">No requests match your search.</div>}
        {!loading && filteredTickets.length > 0 && <table>
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
                <td><div className="request-cell"><span className="request-icon">↗</span><strong>{ticket.issue}</strong></div></td>
                <td>{ticket.name}</td>
                <td>{ticket.department}</td>
                <td><span className={`priority ${String(ticket.priority || "Low").toLowerCase()}`}>{ticket.priority || "Low"}</span></td>
                <td><span className="status-dot"><i></i>{ticket.status || "Open"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>}
      </section>
    </div>
  );
}

export default ViewTickets;
