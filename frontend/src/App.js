// src/App.js
import React, { useEffect, useState } from "react";
import "./styles/GroupDetailPage.css";
import { fetchGroups, createGroup } from "./api";
import GroupDetailPage from "./pages/GroupDetailPage";

function App() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");

  // THEME STATE
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchGroups();
        setGroups(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    try {
      const created = await createGroup(name);
      setGroups((prev) => [created, ...prev]);
      setNewGroupName("");
    } catch (e) {
      console.error(e);
    }
  };

  if (selectedGroup) {
    return (
      <GroupDetailPage
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  return (
    <div className="group-detail-page">
      <div className="group-detail-page-inner">
        {/* Top bar with theme toggle */}
        <div className="top-bar">
          <h2 className="group-title">Groups</h2>
          <button
            type="button"
            className="btn-pill theme-toggle-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="add-member-form">
          <div className="form-row">
            <label>New group</label>
            <input
              type="text"
              placeholder="Trip to Goa"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Create Group
          </button>
        </form>

        <ul className="expenses-list" style={{ marginTop: 16 }}>
          {groups.map((g) => (
            <li
              key={g.id}
              className="expenses-list-item"
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedGroup(g)}
            >
              <div className="expense-main">
                <span className="expense-description">{g.name}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
