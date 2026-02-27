// src/pages/GroupDetailPage.js
import React, { useEffect, useMemo, useState } from "react";
import "../styles/GroupDetailPage.css";
import {
  fetchExpenses,
  fetchSettlements,
  createExpense,
  createSettlement,
  fetchGroupMembers,
  addGroupMember,
  renameGroupMember,
  updateExpense,
  deleteExpense,
  deleteSettlement,
  fetchGroupAnalytics,
} from "../api";

import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

/* --------- Helpers --------- */

// Calculate balances for each member based on expenses and settlements
function calculateBalances(members, expenses, settlements) {
  const balances = {};
  members.forEach((m) => {
    balances[m] = 0;
  });

  // Expenses: everyone owes equal share, payer fronted the full amount
  expenses.forEach((exp) => {
    const participants = members; // all members share equally for now
    if (!exp.amount || participants.length === 0) return;

    const amount = Number(exp.amount) || 0;
    const share = amount / participants.length;

    const paidByName =
      exp.paid_by && exp.paid_by.username ? exp.paid_by.username : "Unknown";

    // Each participant owes their share
    participants.forEach((person) => {
      if (balances[person] === undefined) balances[person] = 0;
      balances[person] -= share;
    });

    // Payer gets credit for paying the whole bill
    if (balances[paidByName] === undefined) balances[paidByName] = 0;
    balances[paidByName] += amount;
  });

  // Settlements: from pays to
  settlements.forEach((s) => {
    const fromName =
      s.from_user && s.from_user.username
        ? s.from_user.username
        : s.from_name || null;
    const toName =
      s.to_user && s.to_user.username
        ? s.to_user.username
        : s.to_name || null;

    if (!fromName || !toName) return;

    if (balances[fromName] === undefined) balances[fromName] = 0;
    if (balances[toName] === undefined) balances[toName] = 0;

    const amt = Number(s.amount) || 0;
    // From pays money → their debt reduces
    balances[fromName] += amt;
    // To receives money → their credit reduces
    balances[toName] -= amt;
  });

  return balances;
}

/* --------- Components --------- */

// Add-Expense form (normal)
function ExpensesForm({ groupId, onAddExpense, currentPayer }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedDesc = description.trim();
    const amt = parseFloat(amount);

    if (!trimmedDesc || isNaN(amt) || amt <= 0) {
      setLocalError("Please enter a valid description and amount.");
      return;
    }
    if (!currentPayer) {
      setLocalError("Select who paid using the 'Set as payer' button above.");
      return;
    }

    try {
      setLoading(true);
      setLocalError("");

      await onAddExpense({
        group: groupId,
        description: trimmedDesc,
        amount: amt,
        paid_by_name: currentPayer,
      });

      setDescription("");
      setAmount("");
    } catch (err) {
      console.error(err);
      setLocalError("Failed to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h3 className="section-title">Add Expense</h3>

      <p className="small-text">
        Payer: <strong>{currentPayer || "not selected"}</strong>
      </p>

      {localError && <p className="error-text">{localError}</p>}

      <form className="expense-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Description</label>
          <input
            type="text"
            placeholder="Dinner, rent, taxi..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <label>Amount (₹)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
}

// AI natural-language input
function NaturalLanguageExpense({ groupId, members, onCreateFromParsed }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const sentence = text.trim();
    if (!sentence) return;

    try {
      setLoading(true);
      setLocalError("");

      // If you don't have React proxy, use full URL:
      // const res = await fetch("http://127.0.0.1:8000/api/parse-expense-text/", {
      const res = await fetch("/api/parse-expense-text/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sentence,
          group_id: groupId,
          members,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to parse");
      }

      const parsed = await res.json();
      await onCreateFromParsed(parsed);
      setText("");
    } catch (err) {
      console.error(err);
      setLocalError(
        "Could not understand that sentence. Try a simpler one, like: 'Prashant paid 1500 for dinner yesterday split between all'."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h3 className="section-title">Add via sentence (AI)</h3>
      <p className="small-text">
        Example: <em>Prashant paid 1500 for dinner yesterday split between all</em>
      </p>
      {localError && <p className="error-text">{localError}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Sentence</label>
          <input
            type="text"
            placeholder="Type your expense in plain English..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Understanding..." : "Create Expense"}
        </button>
      </form>
    </div>
  );
}

/* --------- Main page --------- */

function GroupDetailPage({ group, onBack, theme, setTheme }) {
  const [members, setMembers] = useState([]);
  const [currentPayer, setCurrentPayer] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const [settleAmount, setSettleAmount] = useState("");
  const [settleFrom, setSettleFrom] = useState("");
  const [settleTo, setSettleTo] = useState("");
  const [settleNote, setSettleNote] = useState("");

  const [newMemberName, setNewMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [editingMember, setEditingMember] = useState(null);
  const [editingMemberName, setEditingMemberName] = useState("");
  const [savingMemberEdit, setSavingMemberEdit] = useState(false);

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tabs & analytics
  const [tab, setTab] = useState("details"); // "details" | "summary"
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [allExpenses, allSettlements, groupMembers] = await Promise.all([
          fetchExpenses(),
          fetchSettlements(),
          fetchGroupMembers(group.id),
        ]);

        const groupExpenses = allExpenses.filter(
          (e) => e.group === group.id
        );
        const groupSettlements = allSettlements.filter(
          (s) => s.group === group.id
        );

        setExpenses(groupExpenses);
        setSettlements(groupSettlements);

        const memberNames = groupMembers.map((m) => m.username);
        setMembers(memberNames);

        if (memberNames.length > 0) {
          setCurrentPayer(memberNames[0]);
        }
        if (memberNames.length > 1) {
          setSettleFrom(memberNames[0]);
          setSettleTo(memberNames[1]);
        } else if (memberNames.length === 1) {
          setSettleFrom(memberNames[0]);
          setSettleTo(memberNames[0]);
        }

        // reset analytics when group changes
        setAnalytics(null);
        setAnalyticsError("");
      } catch (e) {
        console.error(e);
        setError("Failed to load group data");
      } finally {
        setLoading(false);
      }
    };

    if (group && group.id != null) {
      load();
    }
  }, [group]);

  const loadAnalytics = async () => {
    if (!group?.id) return;
    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");
      const data = await fetchGroupAnalytics(group.id);
      setAnalytics(data);
    } catch (e) {
      console.error(e);
      setAnalyticsError("Failed to load insights");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const balances = useMemo(
    () => calculateBalances(members, expenses, settlements),
    [members, expenses, settlements]
  );

  const handleAddExpense = async (payload) => {
    try {
      const newExp = await createExpense(payload);
      setExpenses((prev) => [newExp, ...prev]);
    } catch (err) {
      console.error(err);
      setError("Failed to add expense");
      throw err;
    }
  };

  const handleCreateFromParsed = async (parsed) => {
    const payload = {
      group: group.id,
      description: parsed.description,
      amount: parsed.amount,
      paid_by_name: parsed.payer_name,
      // date: parsed.date,
      // split_type: parsed.split_type,
      // participants: parsed.participants,
    };
    await handleAddExpense(payload);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    try {
      setAddingMember(true);
      setError("");
      const created = await addGroupMember(group.id, trimmed);

      setMembers((prev) => [...prev, created.username]);
      setNewMemberName("");

      if (!currentPayer) setCurrentPayer(created.username);
      if (members.length === 0) {
        setSettleFrom(created.username);
        setSettleTo(created.username);
      } else if (members.length === 1) {
        setSettleTo(created.username);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const startEditMember = (name) => {
    setEditingMember(name);
    setEditingMemberName(name);
  };

  const cancelEditMember = () => {
    setEditingMember(null);
    setEditingMemberName("");
  };

  const saveEditMember = async (oldName) => {
    const trimmed = editingMemberName.trim();
    if (!trimmed || trimmed === oldName) {
      cancelEditMember();
      return;
    }
    try {
      setSavingMemberEdit(true);
      setError("");
      const updated = await renameGroupMember(group.id, oldName, trimmed);
      const newName = updated.username || trimmed;

      setMembers((prev) =>
        prev.map((m) => (m === oldName ? newName : m))
      );
      setSettleFrom((prev) => (prev === oldName ? newName : prev));
      setSettleTo((prev) => (prev === oldName ? newName : prev));
      setCurrentPayer((prev) => (prev === oldName ? newName : prev));

      cancelEditMember();
    } catch (err) {
      console.error(err);
      setError("Failed to rename member");
    } finally {
      setSavingMemberEdit(false);
    }
  };

  const handleAddSettlement = async (e) => {
    e.preventDefault();
    const amt = parseFloat(settleAmount);

    if (isNaN(amt) || amt <= 0) return;
    if (settleFrom === settleTo) {
      setError("From and To members must be different.");
      return;
    }

    try {
      const newSet = await createSettlement({
        group: group.id,
        amount: amt,
        note: settleNote || "Manual settlement",
        from_name: settleFrom,
        to_name: settleTo,
      });

      setSettlements((prev) => [newSet, ...prev]);
      setSettleAmount("");
      setSettleNote("");
    } catch (err) {
      console.error(err);
      setError("Failed to add settlement");
    }
  };

  const startEditExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setEditDesc(exp.description || "");
    setEditAmount(String(exp.amount ?? ""));
  };

  const cancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditDesc("");
    setEditAmount("");
  };

  const saveEditExpense = async (exp) => {
    const trimmedDesc = editDesc.trim();
    const amt = parseFloat(editAmount);
    if (!trimmedDesc || isNaN(amt) || amt <= 0) return;

    try {
      setError("");
      const updated = await updateExpense(exp.id, {
        description: trimmedDesc,
        amount: amt,
      });
      setExpenses((prev) =>
        prev.map((e) => (e.id === exp.id ? { ...e, ...updated } : e))
      );
      cancelEditExpense();
    } catch (err) {
      console.error(err);
      setError("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      setError("");
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete expense");
    }
  };

  const handleDeleteSettlement = async (id) => {
    if (!window.confirm("Delete this settlement record?")) return;
    try {
      setError("");
      await deleteSettlement(id);
      setSettlements((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete settlement");
    }
  };

  if (loading) {
    return (
      <div className="group-detail-page">
        <div className="group-detail-page-inner">
          <button className="back-button" onClick={onBack}>
            ← Back to Groups
          </button>
          <p style={{ color: "#e5e7eb", marginTop: 8 }}>Loading group data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-detail-page">
      <div className="group-detail-page-inner">
        <div className="top-bar">
          <button className="back-button" onClick={onBack}>
            ← Back to Groups
          </button>

          <button
            type="button"
            className="btn-pill theme-toggle-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        <h2 className="group-title">{group?.name || "Group"}</h2>

        {error && <p className="error-text">{error}</p>}

        {/* Tabs */}
        <div className="group-tabs">
          <button
            type="button"
            className={tab === "details" ? "tab-pill active" : "tab-pill"}
            onClick={() => setTab("details")}
          >
            Details
          </button>
          <button
            type="button"
            className={tab === "summary" ? "tab-pill active" : "tab-pill"}
            onClick={() => {
              setTab("summary");
              if (!analytics) loadAnalytics();
            }}
          >
            Summary / Insights
          </button>
        </div>

        {tab === "details" ? (
          <div className="group-columns">
            {/* Column 1: Members */}
            <div className="section">
              <h3 className="section-title">Members</h3>
              <p className="small-text">
                Tap “Set as payer” to select who paid for the next expense.
              </p>
              <ul className="members-list">
                {members.length === 0 ? (
                  <li className="members-list-item">
                    <span className="members-name">No members yet.</span>
                  </li>
                ) : (
                  members.map((m) => {
                    const isEditing = editingMember === m;
                    const isPayer = currentPayer === m;
                    return (
                      <li key={m} className="members-list-item">
                        <div className="members-left">
                          {isEditing ? (
                            <input
                              className="member-edit-input"
                              type="text"
                              value={editingMemberName}
                              onChange={(e) =>
                                setEditingMemberName(e.target.value)
                              }
                              disabled={savingMemberEdit}
                            />
                          ) : (
                            <>
                              <span className="members-name">{m}</span>
                              {isPayer && (
                                <span className="payer-tag">payer</span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="member-actions">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn-pill"
                                onClick={() => saveEditMember(m)}
                                disabled={savingMemberEdit}
                              >
                                {savingMemberEdit ? "Saving..." : "Save"}
                              </button>
                              <button
                                type="button"
                                className="btn-pill"
                                onClick={cancelEditMember}
                                disabled={savingMemberEdit}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-pill"
                                onClick={() => startEditMember(m)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-pill"
                                onClick={() => setCurrentPayer(m)}
                              >
                                Set as payer
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>

              <form className="add-member-form" onSubmit={handleAddMember}>
                <div className="form-row">
                  <label>Add friend</label>
                  <input
                    type="text"
                    placeholder="Friend name (e.g. Rahul)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    disabled={addingMember}
                    className="add-member-input"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addingMember}
                >
                  {addingMember ? "Adding..." : "Add Friend"}
                </button>
              </form>
            </div>

            {/* Column 2: Add Expense */}
            <ExpensesForm
              groupId={group.id}
              onAddExpense={handleAddExpense}
              currentPayer={currentPayer}
            />

            {/* Column 3: AI sentence input */}
            <NaturalLanguageExpense
              groupId={group.id}
              members={members}
              onCreateFromParsed={handleCreateFromParsed}
            />

            {/* Column 4: Expenses list */}
            <div className="section">
              <h3 className="section-title">Expenses</h3>
              {expenses.length === 0 ? (
                <p className="empty-text">
                  No expenses yet. Add one in the form.
                </p>
              ) : (
                <ul className="expenses-list">
                  {expenses.map((exp) => {
                    const isEditing = editingExpenseId === exp.id;
                    return (
                      <li key={exp.id} className="expenses-list-item">
                        <div className="expense-main">
                          {isEditing ? (
                            <>
                              <input
                                className="expense-edit-input"
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                              />
                              <input
                                className="expense-edit-input amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={editAmount}
                                onChange={(e) =>
                                  setEditAmount(e.target.value)
                                }
                              />
                            </>
                          ) : (
                            <>
                              <span className="expense-description">
                                {exp.description}
                              </span>
                              <span className="expense-amount">
                                ₹{exp.amount}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="expense-meta">
                          <span>
                            Paid by:{" "}
                            {exp.paid_by && exp.paid_by.username
                              ? exp.paid_by.username
                              : "Unknown"}
                          </span>
                          <span className="expense-meta-separator">•</span>
                          <span>
                            Date:{" "}
                            {exp.date
                              ? exp.date
                              : new Date(exp.created_at)
                                  .toISOString()
                                  .slice(0, 10)}
                          </span>
                        </div>

                        <div className="expense-actions">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn-pill"
                                onClick={() => saveEditExpense(exp)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn-pill"
                                onClick={cancelEditExpense}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-pill"
                                onClick={() => startEditExpense(exp)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn-pill btn-pill-danger"
                                onClick={() => handleDeleteExpense(exp.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Column 5: Settlements */}
            <div className="section">
              <h3 className="section-title">Settle Payment (record only)</h3>
              <form className="settle-form" onSubmit={handleAddSettlement}>
                <div className="form-row">
                  <label>From</label>
                  <select
                    value={settleFrom}
                    onChange={(e) => setSettleFrom(e.target.value)}
                  >
                    {members.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>To</label>
                  <select
                    value={settleTo}
                    onChange={(e) => setSettleTo(e.target.value)}
                  >
                    {members.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <label>Note (optional)</label>
                  <input
                    type="text"
                    placeholder="UPI, cash, etc."
                    value={settleNote}
                    onChange={(e) => setSettleNote(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary">
                  Add Settlement
                </button>
              </form>

              {settlements.length === 0 ? (
                <p className="empty-text" style={{ marginTop: 10 }}>
                  No settlements recorded yet.
                </p>
              ) : (
                <ul className="settlements-list">
                  {settlements.map((s) => (
                    <li key={s.id} className="settlements-list-item">
                      <div className="settlement-main">
                        <span>
                          {s.from_user && s.from_user.username
                            ? s.from_user.username
                            : s.from_name || "Someone"}{" "}
                          paid{" "}
                          {s.to_user && s.to_user.username
                            ? s.to_user.username
                            : s.to_name || "someone"}{" "}
                          ₹{s.amount}
                        </span>
                        {s.note && (
                          <span className="settlement-note">{s.note}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-pill btn-pill-danger"
                        onClick={() => handleDeleteSettlement(s.id)}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Column 6: Balances */}
            <div className="section">
              <h3 className="section-title">Balances (approx)</h3>
              <ul className="balances-list">
                {Object.entries(balances).map(([name, value]) => (
                  <li key={name} className="balances-list-item">
                    <span className="balance-name">{name}</span>
                    {value > 0 ? (
                      <span className="balance-positive">
                        should receive ₹{value.toFixed(2)}
                      </span>
                    ) : value < 0 ? (
                      <span className="balance-negative">
                        owes ₹{(-value).toFixed(2)}
                      </span>
                    ) : (
                      <span className="balance-zero">settled up</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="section analytics-section">
            <h3 className="section-title">Summary / Insights</h3>
            {analyticsLoading && (
              <p className="small-text">Loading insights...</p>
            )}
            {analyticsError && <p className="error-text">{analyticsError}</p>}
            {analytics && (
              <div className="analytics-grid">
                {/* Total spent per member */}
                <div className="analytics-card">
                  <h4 className="analytics-title">Total spent per member</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analytics.per_member || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Category breakdown */}
                <div className="analytics-card">
                  <h4 className="analytics-title">Category breakdown</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={analytics.per_category || []}
                        dataKey="total"
                        nameKey="category"
                        outerRadius={80}
                        label
                      >
                        {(analytics.per_category || []).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              ["#22c55e", "#3b82f6", "#f97316", "#e11d48", "#a855f7"][
                                index % 5
                              ]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Monthly spend */}
                <div className="analytics-card analytics-full">
                  <h4 className="analytics-title">Monthly spend</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={analytics.per_month || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetailPage;
