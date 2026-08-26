import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout } from "../utils/authStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  useEffect(() => { getCurrentUser().then(setUser); }, []);
  async function signOut() { try { await logout(); } finally { setUser(null); } }
  return <AuthContext.Provider value={{ user, setUser, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
