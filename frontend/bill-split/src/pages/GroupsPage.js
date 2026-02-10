// src/pages/GroupsPage.js
import React, { useEffect, useState } from "react";
import "../styles/GroupsPage.css";
import { fetchGroups, createGroup } from "../api";

function GroupsPage({ onOpenGroup }) {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchGroups();
        setGroups(data);
      } catch (e) {
        setError("Failed to load groups");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const newGroup = await createGroup(groupName.trim());
      setGroups((prev) => [...prev, newGroup]);
      setGroupName("");
    } catch (e) {
      setError("Failed to create group");
      console.error(e);
    }
  };

  if (loading) {
    return <div className="groups-page">Loading groups...</div>;
  }

  return (
    <div className="groups-page">
      <div className="groups-header">
        <h2>Your Groups</h2>
      </div>

      {error && <p className="error-text">{error}</p>}

      <form className="add-group-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="New group name (e.g. Office Lunch)"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="add-group-input"
        />
        <button type="submit" className="add-group-button">
          Add Group
        </button>
      </form>

      <ul className="groups-list">
        {groups.map((g) => (
          <li key={g.id} className="groups-list-item">
            <span className="group-name">{g.name}</span>
            <button
              className="open-group-button"
              onClick={() => onOpenGroup(g)}
            >
              Open
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GroupsPage;
