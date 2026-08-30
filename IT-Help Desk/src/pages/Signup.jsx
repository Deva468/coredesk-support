import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../utils/authStore";
import { useAuth } from "../components/AuthContext";

function Signup() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [department, setDepartment] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const { setUser } = useAuth(); const navigate = useNavigate();
  async function handleSubmit(event) { event.preventDefault(); setError(""); try { setUser(await signup({ name, email, department, password })); setName(""); setEmail(""); setDepartment(""); setPassword(""); navigate("/", { replace: true }); } catch (err) { setError(err.message); } }
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 5.5v6c0 5.25 3.4 10.15 8 11.5 4.6-1.35 8-6.25 8-11.5v-6L12 2z" fill="#e87e47" />
            <path d="M12 6a3.5 3.5 0 0 0-3.5 3.5v2.2a1.8 1.8 0 0 0 1.8 1.8h.5v-3.6h-1.3v-.4a2.5 2.5 0 0 1 5 0v.4h-1.3v3.6h.5a1.8 1.8 0 0 0 1.8-1.8V9.5A3.5 3.5 0 0 0 12 6z" fill="#ffffff" />
            <circle cx="12" cy="17" r="1.3" fill="#ffffff" />
          </svg>
        </span>
        <strong>CoreDesk</strong>
        <small>IT Service Desk</small>
      </div>
      <div className="auth-card">
        <span className="eyebrow">GET STARTED</span>
        <h1>Create your account</h1>
        <p>Use your account to submit and track IT requests.</p>
        {error && <div className="form-error">{error}</div>}
        <form autoComplete="off" onSubmit={handleSubmit}>
          <label>
            Full name
            <input autoComplete="off" type="text" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Work email
            <input autoComplete="off" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Department
            <input autoComplete="off" type="text" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. Finance" />
          </label>
          <label>
            Password <small className="field-hint">8 characters minimum</small>
            <input autoComplete="new-password" type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <button className="button primary" type="submit">Create account <span>→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}

export default Signup;
