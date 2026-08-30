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
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Unable to complete request"
    );
  }

  return data;
}

export async function login({
  email,
  password,
  role,
}) {
  const data = await request(
    "/auth/login",
    {
      method: "POST",

      body: JSON.stringify({
        email,
        password,
        role,
      }),
    }
  );

  localStorage.setItem(
    TOKEN_KEY,
    data.token
  );

  return data.user;
}

export async function signup(details) {
  const data = await request(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify(details),
    }
  );

  localStorage.setItem(
    TOKEN_KEY,
    data.token
  );

  return data.user;
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const data = await request(
      "/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return data.user;
  } catch {
    clearToken();
    return null;
  }
}

export async function googleLogin(credential) {
  const data = await request(
    "/auth/google",
    {
      method: "POST",

      body: JSON.stringify({
        credential,
      }),
    }
  );

  localStorage.setItem(
    TOKEN_KEY,
    data.token
  );

  return data.user;
}

export async function logout() {
  const token = getToken();

  try {
    if (token) {
      await request(
        "/auth/logout",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } finally {
    clearToken();
  }
}