import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { getTickets } from "../utils/ticketStore";
import { getToken } from "../utils/authStore";

function Home() {
  const [tickets, setTickets] = useState([]);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getTickets().then((data) => setTickets(Array.isArray(data) ? data : []));
    fetch(`${API_BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((response) => response.json())
      .then((data) => setNotifications(Array.isArray(data) ? data.filter((item) => !item.read) : []))
      .catch(() => setNotifications([]));
    fetch(`${API_BASE_URL}/admin/activity`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setActivities([]));
  }, []);

  const openCount = tickets.filter((ticket) => (ticket.status || "Open") === "Open").length;
  const urgentCount = tickets.filter((ticket) => ticket.priority === "High").length;

  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    d.setHours(0, 0, 0, 0);
    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const isToday = idx === 6;

    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const sourceData = activities.length > 0 ? activities : tickets;
    const count = sourceData.filter((item) => {
      const itemTime = new Date(item.createdAt || item.submittedAt).getTime();
      return itemTime >= dayStart && itemTime < dayEnd;
    }).length;

    return { date: d, dayLabel, count, isToday };
  });

  const maxActivity = Math.max(1, ...last7Days.map((d) => d.count));
  const topY = Math.max(10, Math.ceil(maxActivity / 5) * 5);
  const yLabels = [topY, Math.round((topY * 2) / 3), Math.round(topY / 3), 0];

  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <span className="eyebrow">IT SERVICE DESK</span>
          <h1>Welcome to your service desk</h1>
          <p>Submit a request, track progress, and get the support you need.</p>
        </div>
        <Link className="button primary" to="/add"><span>+</span> Create request</Link>
      </header>
      {notifications.length > 0 && (
        <div className="notification-banner">
          <span>✓</span>
          <div>
            <strong>Request resolved</strong>
            <p>{notifications[0].message}</p>
          </div>
        </div>
      )}
      <section className="stats-grid" aria-label="Ticket summary">
        <Link to="/tickets?status=Open" className="stat-card accent">
          <span className="stat-icon">↗</span>
          <div>
            <span className="stat-label">Open requests</span>
            <strong>{openCount}</strong>
            <small>Needs attention</small>
          </div>
        </Link>
        <Link to="/tickets" className="stat-card">
          <span className="stat-icon blue">⌁</span>
          <div>
            <span className="stat-label">Total requests</span>
            <strong>{tickets.length}</strong>
            <small>All time</small>
          </div>
        </Link>
        <Link to="/tickets?priority=High" className="stat-card">
          <span className="stat-icon amber">!</span>
          <div>
            <span className="stat-label">High priority</span>
            <strong>{urgentCount}</strong>
            <small>Requires action</small>
          </div>
        </Link>
        <Link to="/tickets" className="stat-card">
          <span className="stat-icon green">✓</span>
          <div>
            <span className="stat-label">First response</span>
            <strong>24m</strong>
            <small className="positive">↓ 12% this week</small>
          </div>
        </Link>
      </section>
      <section className="dashboard-grid">
        <div className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SERVICE HEALTH</span>
              <h2>Request activity</h2>
            </div>
            <span className="period">Last 7 days</span>
          </div>
          <div className="chart">
            <div className="chart-y">
              {yLabels.map((lbl, i) => <span key={i}>{lbl}</span>)}
            </div>
            <div className="chart-area">
              <div className="chart-lines">
                <i></i><i></i><i></i><i></i>
              </div>
              <div className="bars">
                {last7Days.map((day, idx) => {
                  const heightPercent = day.count > 0 ? Math.max(14, Math.round((day.count / topY) * 100)) : 6;
                  return (
                    <b
                      key={idx}
                      className={day.isToday ? "today" : ""}
                      style={{ height: `${Math.min(100, heightPercent)}%` }}
                      title={`${day.dayLabel}: ${day.count} activities`}
                    />
                  );
                })}
              </div>
              <div className="chart-x">
                {last7Days.map((day, idx) => <span key={idx}>{day.dayLabel}</span>)}
              </div>
            </div>
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot teal"></i>Active operations</span>
            <span><i className="legend-dot pale"></i>Baseline level</span>
          </div>
        </div>
        <div className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">SELF SERVICE</span>
              <h2>How can we help?</h2>
            </div>
          </div>
          <p>Start with a quick action or find an answer before raising a request.</p>
          <div className="quick-actions">
            <Link to="/add">
              <span className="quick-icon">+</span>
              <span>
                <strong>Raise a request</strong>
                <small>Tell us what you need</small>
              </span>
              <b>→</b>
            </Link>
            <a href="mailto:spareinbox657@gmail.com">
              <span className="quick-icon book">?</span>
              <span>
                <strong>Contact support</strong>
                <small>Email the support team</small>
              </span>
              <b>→</b>
            </a>
          </div>
        </div>
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">WORK QUEUE</span>
            <h2>Recent requests</h2>
          </div>
          <Link className="text-link" to="/tickets">View all requests →</Link>
        </div>
        {tickets.length === 0 ? (
          <div className="empty-state">Your request queue is clear. Create a request to get started.</div>
        ) : (
          <div className="mini-list">
            {tickets.slice(0, 4).map((ticket) => (
              <div className="mini-row" key={ticket._id}>
                <span className="ticket-avatar">{(ticket.name || "U").slice(0, 2).toUpperCase()}</span>
                <div className="ticket-summary">
                  <strong>{ticket.issue}</strong>
                  <small>{ticket.name} · {ticket.department}</small>
                </div>
                <span className={`priority ${String(ticket.priority || "Low").toLowerCase()}`}>{ticket.priority || "Low"}</span>
                <span className="status-dot"><i></i>{ticket.status || "Open"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;