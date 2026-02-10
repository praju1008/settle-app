// src/pages/GroupDetailPage.js
import React, { useEffect, useMemo, useState } from "react";
import "../styles/GroupDetailPage.css";
import {
  fetchExpenses,
  fetchSettlements,
  createExpense,
  createSettlement,
} from "../api";

function calculateBalances(members, expenses) {
  const balances = {};
  members.forEach((m) => (balances[m] = 0));

  expenses.forEach((exp) => {
    const participants = exp.participants || ["You", "Friend1", "Friend2"]; // temporary
    const share = exp.amount / participants.length;
    const paidByName = exp.paid_by?.username || "You";

    participants.forEach((person) => {
      if (person === paidByName) {
        balances[person] += exp.amount - share;
      } else {
        balances[person] -= share;
        balances[paidByName] += share;
      }
    });
  });

  return balances;
}

function GroupDetailPage({ group, onBack }) {
  const [members] = useState(["You", "Friend1", "Friend2"]);

  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const [settleAmount, setSettleAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [allExpenses, allSettlements] = await Promise.all([
          fetchExpenses(),
          fetchSettlements(),
        ]);
        setExpenses(allExpenses.filter((e) => e.group === group.id));
        setSettlements(allSettlements.filter((s) => s.group === group.id));
      } catch (e) {
        console.error(e);
        setError("Failed to load group data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [group.id]);

  const balances = useMemo(
    () => calculateBalances(members, expenses),
    [members, expenses]
  );

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!description.trim() || isNaN(amt) || amt <= 0) return;

    try {
      const newExp = await createExpense({
        group: group.id,
        description: description.trim(),
        amount: amt,
      });
      setExpenses((prev) => [newExp, ...prev]);
      setDescription("");
      setAmount("");
    } catch (err) {
      console.error(err);
      setError("Failed to add expense");
    }
  };

  const handleAddSettlement = async (e) => {
    e.preventDefault();
    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      const newSet = await createSettlement({
        group: group.id,
        to_user: 1, // temporary until real auth, backend uses demo from_user
        amount: amt,
        note: "Manual settlement",
      });
      setSettlements((prev) => [newSet, ...prev]);
      setSettleAmount("");
    } catch (err) {
      console.error(err);
      setError("Failed to add settlement");
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

      <h2 className="group-title">{group.name}</h2>

      {error && <p className="error-text">{error}</p>}

      {/* Members */}
      <div className="section">
        <h3 className="section-title">Members</h3>
        <ul className="members-list">
          {members.map((m) => (
            <li key={m} className="members-list-item">
              {m}
            </li>
          ))}
        </ul>
      </div>

      {/* Add Expense */}
      <div className="section">
        <h3 className="section-title">Add Expense</h3>
        <form className="expense-form" onSubmit={handleAddExpense}>
          <div className="form-row">
            <label>Description</label>
            <input
              type="text"
              placeholder="Dinner, rent, taxi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
            />
          </div>

          <button type="submit" className="add-expense-button">
            Add Expense
          </button>
        </form>
      </div>

      {/* Expenses list */}
      <div className="section">
        <h3 className="section-title">Expenses</h3>
        {expenses.length === 0 ? (
          <p className="empty-text">No expenses yet. Add one above.</p>
        ) : (
          <ul className="expenses-list">
            {expenses.map((exp) => (
              <li key={exp.id} className="expenses-list-item">
                <div className="expense-main">
                  <span className="expense-description">
                    {exp.description}
                  </span>
                  <span className="expense-amount">₹{exp.amount}</span>
                </div>
                <div className="expense-meta">
                  <span>
                    Paid by: {exp.paid_by ? exp.paid_by.username : "Unknown"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Settlements */}
      <div className="section">
        <h3 className="section-title">Settle Payment (record only)</h3>
        <form className="settle-form" onSubmit={handleAddSettlement}>
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
                  {s.from_user?.username} paid {s.to_user?.username} ₹
                  {s.amount}
                </span>
                <span className="settlement-note">{s.note}</span>
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
