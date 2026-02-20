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
} from "../api";

// Calculate balances for each member based on expenses and settlements
function calculateBalances(members, expenses, settlements) {
  const balances = {};
  members.forEach((m) => {
    balances[m] = 0;
  });

  // 1) Apply expenses
  expenses.forEach((exp) => {
    const participants = members;
    const share =
      exp.amount && participants.length > 0
        ? exp.amount / participants.length
        : 0;

    const paidByName =
      exp.paid_by && exp.paid_by.username ? exp.paid_by.username : "Unknown";

    participants.forEach((person) => {
      if (balances[person] === undefined) balances[person] = 0;
      if (balances[paidByName] === undefined) balances[paidByName] = 0;

      if (person === paidByName) {
        balances[person] += exp.amount - share;
      } else {
        balances[person] -= share;
        balances[paidByName] += share;
      }
    });
  });

  // 2) Apply settlements
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
    balances[fromName] += amt;
    balances[toName] -= amt;
  });

  return balances;
}

// Add-Expense form now also shows which member is payer (read-only text)
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
        paid_by_name: currentPayer, // NEW: who paid
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

        <button type="submit" className="add-expense-button" disabled={loading}>
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
}

function GroupDetailPage({ group, onBack }) {
  const [members, setMembers] = useState([]);
  const [currentPayer, setCurrentPayer] = useState(""); // NEW

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
          setCurrentPayer(memberNames[0]); // default payer
        }
        if (memberNames.length > 1) {
          setSettleFrom(memberNames[0]);
          setSettleTo(memberNames[1]);
        } else if (memberNames.length === 1) {
          setSettleFrom(memberNames[0]);
          setSettleTo(memberNames[0]);
        }
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
        <button className="back-button" onClick={onBack}>
          ← Back to Groups
        </button>
        <p>Loading group data...</p>
      </div>
    );
  }

  return (
    <div className="group-detail-page">
      <button className="back-button" onClick={onBack}>
        ← Back to Groups
      </button>

      <h2 className="group-title">{group?.name || "Group"}</h2>

      {error && <p className="error-text">{error}</p>}

      {/* Members with "Set as payer" */}
      <div className="section">
        <h3 className="section-title">Members</h3>
        <ul className="members-list">
          {members.length === 0 ? (
            <li className="members-list-item">No members yet.</li>
          ) : (
            members.map((m) => {
              const isEditing = editingMember === m;
              const isPayer = currentPayer === m;
              return (
                <li key={m} className="members-list-item">
                  {isEditing ? (
                    <>
                      <input
                        className="member-edit-input"
                        type="text"
                        value={editingMemberName}
                        onChange={(e) =>
                          setEditingMemberName(e.target.value)
                        }
                        disabled={savingMemberEdit}
                      />
                      <button
                        type="button"
                        className="save-member-button"
                        onClick={() => saveEditMember(m)}
                        disabled={savingMemberEdit}
                      >
                        {savingMemberEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="cancel-member-button"
                        onClick={cancelEditMember}
                        disabled={savingMemberEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span>
                        {m} {isPayer && <span className="payer-tag">(payer)</span>}
                      </span>
                      <button
                        type="button"
                        className="edit-member-button"
                        onClick={() => startEditMember(m)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="set-payer-button"
                        onClick={() => setCurrentPayer(m)}
                      >
                        Set as payer
                      </button>
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>

        <form className="add-member-form" onSubmit={handleAddMember}>
          <input
            type="text"
            placeholder="Add friend name (e.g. Rahul)"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            disabled={addingMember}
            className="add-member-input"
          />
          <button
            type="submit"
            className="add-member-button"
            disabled={addingMember}
          >
            {addingMember ? "Adding..." : "Add Friend"}
          </button>
        </form>
      </div>

      {/* Add Expense */}
      <ExpensesForm
        groupId={group.id}
        onAddExpense={handleAddExpense}
        currentPayer={currentPayer}
      />

      {/* Expenses list */}
      <div className="section">
        <h3 className="section-title">Expenses</h3>
        {expenses.length === 0 ? (
          <p className="empty-text">No expenses yet. Add one above.</p>
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
                          onChange={(e) => setEditAmount(e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <span className="expense-description">
                          {exp.description}
                        </span>
                        <span className="expense-amount">₹{exp.amount}</span>
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
                  </div>

                  <div className="expense-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="save-expense-button"
                          onClick={() => saveEditExpense(exp)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="cancel-expense-button"
                          onClick={cancelEditExpense}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="edit-expense-button"
                          onClick={() => startEditExpense(exp)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-expense-button"
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

      {/* Settlements */}
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

          <button type="submit" className="settle-button">
            Add Settlement
          </button>
        </form>

        {settlements.length === 0 ? (
          <p className="empty-text">No settlements recorded yet.</p>
        ) : (
          <ul className="settlements-list">
            {settlements.map((s) => (
              <li key={s.id} className="settlements-list-item">
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
                <button
                  type="button"
                  className="delete-settlement-button"
                  onClick={() => handleDeleteSettlement(s.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Balances */}
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
  );
}

export default GroupDetailPage;
