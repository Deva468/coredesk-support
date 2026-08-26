import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTickets } from "../utils/ticketStore";
import { getToken } from "../utils/authStore";

function Home() {
  const [tickets, setTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getTickets().then((data) => setTickets(Array.isArray(data) ? data : []));
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${getToken()}` } }).then((response) => response.json()).then((data) => setNotifications(Array.isArray(data) ? data.filter((item) => !item.read) : []));
  }, []);

  const openCount = tickets.filter((ticket) => (ticket.status || "Open") === "Open").length;
  const urgentCount = tickets.filter((ticket) => ticket.priority === "High").length;

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div><span className="eyebrow">IT SERVICE DESK</span><h1>Welcome to your service desk</h1><p>Submit a request, track progress, and get the support you need.</p></div>
        <Link className="button primary" to="/add"><span>+</span> Create request</Link>
      </header>
      {notifications.length > 0 && <div className="notification-banner"><span>✓</span><div><strong>Request resolved</strong><p>{notifications[0].message}</p></div></div>}
      <section className="stats-grid" aria-label="Ticket summary">
        <div className="stat-card accent"><span className="stat-icon">↗</span><div><span className="stat-label">Open requests</span><strong>{openCount}</strong><small>Needs attention</small></div></div>
        <div className="stat-card"><span className="stat-icon blue">⌁</span><div><span className="stat-label">Total requests</span><strong>{tickets.length}</strong><small>All time</small></div></div>
        <div className="stat-card"><span className="stat-icon amber">!</span><div><span className="stat-label">High priority</span><strong>{urgentCount}</strong><small>Requires action</small></div></div>
        <div className="stat-card"><span className="stat-icon green">✓</span><div><span className="stat-label">First response</span><strong>24m</strong><small className="positive">↓ 12% this week</small></div></div>
      </section>
      <section className="dashboard-grid">
        <div className="panel activity-panel"><div className="panel-heading"><div><span className="eyebrow">SERVICE HEALTH</span><h2>Request activity</h2></div><span className="period">Last 7 days⌄</span></div><div className="chart"><div className="chart-y"><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart-area"><div className="chart-lines"><i></i><i></i><i></i><i></i></div><div className="bars"><b style={{ height: "35%" }}></b><b style={{ height: "53%" }}></b><b style={{ height: "42%" }}></b><b style={{ height: "72%" }}></b><b style={{ height: "58%" }}></b><b className="today" style={{ height: "87%" }}></b><b style={{ height: "67%" }}></b></div><div className="chart-x"><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span><span>Mon</span></div></div></div><div className="chart-legend"><span><i className="legend-dot teal"></i>Requests received</span><span><i className="legend-dot pale"></i>Requests resolved</span></div></div>
        <div className="panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">SELF SERVICE</span><h2>How can we help?</h2></div></div><p>Start with a quick action or find an answer before raising a request.</p><div className="quick-actions"><Link to="/add"><span className="quick-icon">+</span><span><strong>Raise a request</strong><small>Tell us what you need</small></span><b>→</b></Link><a href="mailto:spareinbox657@gmail.com"><span className="quick-icon book">?</span><span><strong>Contact support</strong><small>Email the support team</small></span><b>→</b></a></div></div>
      </section>
      <section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">WORK QUEUE</span><h2>Recent requests</h2></div><Link className="text-link" to="/tickets">View all requests →</Link></div>{tickets.length === 0 ? <div className="empty-state">Your request queue is clear. Create a request to get started.</div> : <div className="mini-list">{tickets.slice(0, 4).map((ticket) => <div className="mini-row" key={ticket._id}><span className="ticket-avatar">{(ticket.name || "U").slice(0, 2).toUpperCase()}</span><div className="ticket-summary"><strong>{ticket.issue}</strong><small>{ticket.name} · {ticket.department}</small></div><span className={`priority ${String(ticket.priority || "Low").toLowerCase()}`}>{ticket.priority || "Low"}</span><span className="status-dot"><i></i>{ticket.status || "Open"}</span></div>)}</div>}</section>
    </div>
  );
}

export default Home;