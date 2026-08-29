import { API_BASE_URL } from "../api";

function authHeaders() {
  const token = localStorage.getItem("it-help-desk-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTickets() {
  const response = await fetch(`${API_BASE_URL}/tickets`, { headers: authHeaders() });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 ? "Your session has expired. Please sign in again." : data.message || "Failed to load tickets from the backend");
  return Array.isArray(data) ? data : [];
}

export async function addTicket(ticket) {
  const payload = {
    ...ticket,
    status: ticket.status || "Open",
  };

  const response = await fetch(`${API_BASE_URL}/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Your session has expired. Please sign in again." : data.message || "Unable to save ticket to the backend");
  }
  if (!data.ticket?._id) throw new Error("The backend did not confirm the ticket was saved");
  return { ticket: data.ticket, source: "backend" };
}

export async function deleteTicket(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!response.ok) throw new Error(response.status === 401 ? "Your session has expired. Please sign in again." : "Unable to delete ticket");

    return { success: true, source: "backend" };
  } catch {
    throw new Error("Unable to delete ticket from the backend");
  }
}
