// src/api.js
const API_BASE = "http://127.0.0.1:8000/api"; // adjust if needed

// ---------- Groups ----------
export async function fetchGroups() {
  const res = await fetch(`${API_BASE}/groups/`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

export async function createGroup(name) {
  const res = await fetch(`${API_BASE}/groups/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create group");
  return res.json();
}

export async function updateGroup(id, payload) {
  const res = await fetch(`${API_BASE}/groups/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update group");
  return res.json();
}

export async function deleteGroup(id) {
  const res = await fetch(`${API_BASE}/groups/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete group");
}

export async function fetchGroupMembers(groupId) {
  const res = await fetch(`${API_BASE}/groups/${groupId}/members/`);
  if (!res.ok) throw new Error("Failed to fetch group members");
  return res.json(); // [{ id, username }]
}

export async function addGroupMember(groupId, username) {
  const res = await fetch(`${API_BASE}/groups/${groupId}/add_member/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Failed to add member");
  return res.json(); // { id, username }
}

export async function renameGroupMember(groupId, oldUsername, newUsername) {
  const res = await fetch(`${API_BASE}/groups/${groupId}/rename_member/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      old_username: oldUsername,
      new_username: newUsername,
    }),
  });
  if (!res.ok) throw new Error("Failed to rename member");
  return res.json(); // { id, username }
}

// ---------- Expenses ----------
export async function fetchExpenses() {
  const res = await fetch(`${API_BASE}/expenses/`);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function createExpense(payload) {
  const res = await fetch(`${API_BASE}/expenses/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create expense");
  return res.json();
}

export async function updateExpense(id, payload) {
  const res = await fetch(`${API_BASE}/expenses/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update expense");
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/expenses/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete expense");
}

// ---------- Settlements ----------
export async function fetchSettlements() {
  const res = await fetch(`${API_BASE}/settlements/`);
  if (!res.ok) throw new Error("Failed to fetch settlements");
  return res.json();
}

export async function createSettlement(payload) {
  const res = await fetch(`${API_BASE}/settlements/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create settlement");
  return res.json();
}

export async function updateSettlement(id, payload) {
  const res = await fetch(`${API_BASE}/settlements/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update settlement");
  return res.json();
}

export async function deleteSettlement(id) {
  const res = await fetch(`${API_BASE}/settlements/${id}/`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete settlement");
}
