
import { API_BASE_URL } from "../api";

const TOKEN_KEY = "it-help-desk-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.clear();
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

/*
  Login

  UI:
  User  -> employee
  Admin -> admin

  Backend / MongoDB:
  employee / admin
*/
export async function login({ email, password, role }) {
  const normalizedEmail = email.trim().toLowerCase();

  const normalizedRole =
    role === "admin"
      ? "admin"
      : "employee";

  const data = await request("/auth/login", {
    method: "POST",

    body: JSON.stringify({
      email: normalizedEmail,
      password,
      role: normalizedRole,
    }),
  });

  if (!data.token || !data.user) {
    throw new Error("Invalid login response from server");
  }

  localStorage.setItem(TOKEN_KEY, data.token);

  return data.user;
}

/*
  Normal signup users must always become employees.

  DO NOT allow frontend to create an admin account.
*/
export async function signup(details) {
  const data = await request("/auth/signup", {
    method: "POST",

    body: JSON.stringify({
      name: details.name?.trim(),
      email: details.email?.trim().toLowerCase(),
      password: details.password,
      department: details.department?.trim() || "General",
    }),
  });

  if (!data.token || !data.user) {
    throw new Error("Invalid signup response from server");
  }

  localStorage.setItem(TOKEN_KEY, data.token);

  return data.user;
}

/*
  Get currently logged-in user
*/
export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const data = await request("/auth/me", {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data.user || null;
  } catch {
  clearToken();
  return null;
}
}

/*
  Google login
*/
export async function googleLogin(credential) {
  if (!credential) {
    throw new Error("Google login credential is missing");
  }

  const data = await request("/auth/google", {
    method: "POST",

    body: JSON.stringify({
      credential,
    }),
  });

  if (!data.token || !data.user) {
    throw new Error("Invalid Google login response");
  }

  localStorage.setItem(TOKEN_KEY, data.token);

  return data.user;
}

/*
  Logout
*/
export async function logout() {
  const token = getToken();

  try {
    if (token) {
      await request("/auth/logout", {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } finally {
    clearToken();
  }
}