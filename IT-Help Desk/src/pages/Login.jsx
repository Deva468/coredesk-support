import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { googleLogin, login } from "../utils/authStore";
import { useAuth } from "../components/AuthContext";

function Login() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const { setUser } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const googleButton = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  useEffect(() => {
    if (!googleClientId || !googleButton.current) return undefined;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: async ({ credential }) => { try { setUser(await googleLogin(credential)); navigate("/", { replace: true }); } catch (err) { setError(err.message); } } });
      window.google.accounts.id.renderButton(googleButton.current, { theme: "outline", size: "large", width: 345, text: "continue_with" });
    };
    document.body.appendChild(script);
    return () => script.remove();
  }, [googleClientId, navigate, setUser]);
  async function handleSubmit(event) { event.preventDefault(); setError(""); try { setUser(await login({ email, password })); setEmail(""); setPassword(""); navigate(location.state?.from || "/", { replace: true }); } catch (err) { setError(err.message); } }
  return <div className="auth-page"><div className="auth-brand"><span className="brand-mark">+</span><strong>Nexora</strong><small>Service desk</small></div><div className="auth-card"><span className="eyebrow">SECURE ACCESS</span><h1>Welcome back</h1><p>Sign in to manage your support requests.</p>{error && <div className="form-error">{error}</div>}<form autoComplete="off" onSubmit={handleSubmit}><label>Email address<input autoComplete="off" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button primary" type="submit">Sign in <span>→</span></button></form><div className="auth-divider"><span>or</span></div>{googleClientId ? <div className="google-button" ref={googleButton}></div> : <button className="google-button" type="button" disabled>Continue with Google <small>Configure Google sign-in to enable</small></button>}<p className="auth-switch">New to the service desk? <Link to="/signup">Create an account</Link></p></div></div>;
}

export default Login;
