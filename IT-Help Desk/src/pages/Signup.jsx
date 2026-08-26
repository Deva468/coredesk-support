import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../utils/authStore";
import { useAuth } from "../components/AuthContext";

function Signup() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [department, setDepartment] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const { setUser } = useAuth(); const navigate = useNavigate();
  async function handleSubmit(event) { event.preventDefault(); setError(""); try { setUser(await signup({ name, email, department, password })); setName(""); setEmail(""); setDepartment(""); setPassword(""); navigate("/", { replace: true }); } catch (err) { setError(err.message); } }
  return <div className="auth-page"><div className="auth-brand"><span className="brand-mark">+</span><strong>Nexora</strong><small>Service desk</small></div><div className="auth-card"><span className="eyebrow">GET STARTED</span><h1>Create your account</h1><p>Use your account to submit and track IT requests.</p>{error && <div className="form-error">{error}</div>}<form autoComplete="off" onSubmit={handleSubmit}><label>Full name<input autoComplete="off" type="text" value={name} onChange={(event) => setName(event.target.value)} required /></label><label>Work email<input autoComplete="off" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Department<input autoComplete="off" type="text" value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="e.g. Finance" /></label><label>Password <small className="field-hint">8 characters minimum</small><input autoComplete="new-password" type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button primary" type="submit">Create account <span>→</span></button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></div></div>;
}

export default Signup;
