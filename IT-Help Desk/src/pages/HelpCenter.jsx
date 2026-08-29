import { Link } from "react-router-dom";

const faqs = [
  {
    question: "How do I submit a request?",
    answer: "Use the New request page to describe the issue, department, and priority. Your request is routed to the service desk team automatically.",
  },
  {
    question: "How can I track an existing request?",
    answer: "Visit the All tickets page to see the status, assignee, and current progress for your requests.",
  },
  {
    question: "Who can resolve a ticket?",
    answer: "Administrators and assigned resolvers can update the status, assign work, and provide a resolution note.",
  },
  {
    question: "I forgot my password.",
    answer: "Use the account settings page to change your current password once logged in. If you are locked out, contact your administrator.",
  },
];

function HelpCenter() {
  return (
    <div className="page-wrap narrow-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">HELP / KNOWLEDGE BASE</span>
          <h1>Support resources</h1>
          <p>Find quick answers and guidance for common service desk tasks.</p>
        </div>
        <Link className="back-link" to="/">← Back to overview</Link>
      </header>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">FAQ</span>
            <h2>Common questions</h2>
          </div>
        </div>
        <div className="settings-form" style={{ marginTop: "20px" }}>
          {faqs.map((item) => (
            <div key={item.question} style={{ marginBottom: "18px" }}>
              <strong style={{ display: "block", marginBottom: "6px" }}>{item.question}</strong>
              <p style={{ margin: 0, color: "#637278", lineHeight: 1.6 }}>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HelpCenter;
