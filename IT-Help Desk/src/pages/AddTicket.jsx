import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { addTicket } from "../utils/ticketStore";

function AddTicket() {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [requestType, setRequestType] = useState("Incident");
  const [title, setTitle] = useState("");
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState("Low");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    const ticket = {
      name,
      department,
      requestType,
      title,
      issue,
      priority,
    };

    try {
      const result = await addTicket(ticket);

      alert(result.source === "backend" ? "Ticket Added" : "Ticket saved locally");

      setName("");
      setDepartment("");
      setRequestType("Incident");
      setTitle("");
      setIssue("");
      setPriority("Low");
      navigate("/tickets");
    } catch (error) {
      console.error(error);
      alert(error.message || "Something went wrong");
    }
  }

  return (
    <div className="page-wrap narrow-page">
      <header className="page-header compact"><div><span className="eyebrow">SERVICE REQUEST</span><h1>Create a new request</h1><p>Share a few details and our team will get back to you shortly.</p></div></header>
      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-section"><h2>Request details</h2><p className="section-note">Required fields are marked with an asterisk.</p></div>
        <div className="form-grid">
          <label>Requester name <span>*</span><input type="text" placeholder="e.g. Alex Morgan" value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label>Department <span>*</span><input type="text" placeholder="e.g. Finance" value={department} onChange={(e) => setDepartment(e.target.value)} required /></label>
        </div>
        <div className="form-grid">
          <label>Request type <span>*</span><select value={requestType} onChange={(e) => setRequestType(e.target.value)} required><option>Incident</option><option>Service request</option><option>Access request</option><option>Hardware</option><option>Software</option></select></label>
          <label>Subject / title <span>*</span><input type="text" placeholder="e.g. Cannot connect to VPN" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        </div>
        <label>What can we help with? <span>*</span><textarea placeholder="Describe the issue, what you were trying to do, and any useful context..." value={issue} onChange={(e) => setIssue(e.target.value)} required /></label>
        <label>Priority <select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="Low">Low · Can wait a little</option><option value="Medium">Medium · Affects my work</option><option value="High">High · Work is blocked</option></select></label>
        <div className="form-footer"><span className="secure-note">Your request is routed securely to IT support.</span><button className="button primary" type="submit">Submit request <span>→</span></button></div>
      </form>
      <Link className="back-link" to="/">← Back to overview</Link>
    </div>
  );
}

export default AddTicket;