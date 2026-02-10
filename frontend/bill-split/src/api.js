// src/api.js
const API_BASE = "http://127.0.0.1:8000/api";

export async function fetchGroups() {
  try {
    const res = await fetch(`${API_BASE}/groups/`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Failed to fetch groups: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error("fetchGroups error:", error);
    throw error;
  }
}

export async function createGroup(name) {
  try {
    const res = await fetch(`${API_BASE}/groups/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Failed to create group: ${res.status} ${JSON.stringify(data)}`);
    }
    return res.json();
  } catch (error) {
    console.error("createGroup error:", error);
    throw error;
  }
}

export async function fetchExpenses() {
  try {
    const res = await fetch(`${API_BASE}/expenses/`);
    if (!res.ok) throw new Error(`Failed to fetch expenses: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error("fetchExpenses error:", error);
    throw error;
  }
}

export async function createExpense(payload) {
  try {
    const res = await fetch(`${API_BASE}/expenses/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Failed to create expense: ${res.status} ${JSON.stringify(data)}`);
    }
    return res.json();
  } catch (error) {
    console.error("createExpense error:", error);
    throw error;
  }
}

export async function fetchSettlements() {
  try {
    const res = await fetch(`${API_BASE}/settlements/`);
    if (!res.ok) throw new Error(`Failed to fetch settlements: ${res.status}`);
    return res.json();
  } catch (error) {
    console.error("fetchSettlements error:", error);
    throw error;
  }
}

export async function createSettlement(payload) {
  try {
    const res = await fetch(`${API_BASE}/settlements/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Failed to create settlement: ${res.status} ${JSON.stringify(data)}`);
    }
    return res.json();
  } catch (error) {
    console.error("createSettlement error:", error);
    throw error;
  }
}
