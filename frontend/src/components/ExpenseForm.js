// src/components/ExpensesForm.js
import React, { useState } from "react";

function ExpensesForm({ groupId, onAddExpense }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedDesc = description.trim();
    const amt = parseFloat(amount);

    if (!trimmedDesc || isNaN(amt) || amt <= 0) {
      setError("Please enter a valid description and amount.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Delegate actual API call to parent
      await onAddExpense({
        group: groupId,
        description: trimmedDesc,
        amount: amt,
      });

      setDescription("");
      setAmount("");
    } catch (err) {
      console.error(err);
      setError("Failed to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <h3 className="section-title">Add Expense</h3>

      {error && <p className="error-text">{error}</p>}

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

export default ExpensesForm;
