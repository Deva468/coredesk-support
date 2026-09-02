import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { googleLogin, login } from "../utils/authStore";
import { useAuth } from "../components/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");

  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const googleButton = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (role !== "employee") {
      return undefined;
    }

    if (!googleClientId || !googleButton.current) {
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;

    script.onload = () => {
      if (!window.google || !googleButton.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          try {
            setError("");
            const user = await googleLogin(credential);

            if (user.role !== "employee") {
              throw new Error("Google login is available only for employee accounts.");
            }

            setUser(user);
            navigate("/", { replace: true });
          } catch (err) {
            setError(err.message || "Google login failed");
          }
        },
      });

      window.google.accounts.id.renderButton(googleButton.current, {
        theme: "outline",
        size: "large",
        width: 345,
        text: "continue_with",
      });
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [googleClientId, navigate, setUser, role]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      /*
        SECURITY: The role dropdown is just a UI preference.
        The REAL role always comes from the backend/database (user.role).
        We compare it here only to give a clear error message —
        never to grant access.
      */
      if (user.role !== role) {
        throw new Error(
          role === "admin"
            ? "This account is not registered as an administrator."
            : "This account is not registered as an employee."
        );
      }

      setUser(user);
      setEmail("");
      setPassword("");

      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(location.state?.from || "/", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

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
        <span className="eyebrow">SECURE ACCESS</span>
        <h1>Welcome back</h1>
        <p>Sign in to manage your support requests.</p>

        {error && <div className="form-error">{error}</div>}

        <form autoComplete="off" onSubmit={handleSubmit}>
          <label>
            Email address
            <input
              autoComplete="off"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              autoComplete="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label>
            Login As
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setError("");
              }}
              required
            >
              <option value="employee">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button className="button primary" type="submit">
            Sign in <span>→</span>
          </button>
        </form>

        {role === "employee" && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>

            {googleClientId ? (
              <div className="google-button" ref={googleButton}></div>
            ) : (
              <button className="google-button" type="button" disabled>
                Continue with Google
                <small>Configure Google sign-in to enable</small>
              </button>
            )}
          </>
        )}

        {role === "admin" && (
          <div className="admin-login-note">
            Admin access requires an authorized administrator account and password.
          </div>
        )}

        <p className="auth-switch">
          New to the service desk? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;