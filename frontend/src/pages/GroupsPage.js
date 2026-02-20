// src/pages/GroupsPage.js
import React, { useEffect, useState } from "react";
import "../styles/GroupsPage.css";
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../api";

function GroupsPage({ onOpenGroup }) {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchGroups();
        setGroups(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setError("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) return;

    try {
      setError("");
      const newGroup = await createGroup(trimmed);
      if (newGroup && newGroup.id) {
        setGroups((prev) => [...prev, newGroup]);
      }
      setGroupName("");
    } catch (e) {
      console.error(e);
      setError("Failed to create group");
    }
  };

  const startEdit = (group) => {
    setEditingId(group.id);
    setEditingName(group.name || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (group) => {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === group.name) {
      cancelEdit();
      return;
    }
    try {
      setSavingEdit(true);
      setError("");
      const updated = await updateGroup(group.id, { name: trimmed });
      if (updated && updated.id) {
        setGroups((prev) =>
          prev.map((g) => (g.id === group.id ? { ...g, ...updated } : g))
        );
      }
      cancelEdit();
    } catch (e) {
      console.error(e);
      setError("Failed to update group");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Delete this group and all its data?")) return;
    try {
      setError("");
      await deleteGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      console.error(e);
      setError("Failed to delete group");
    }
  };

  if (loading) {
    return (
      <div className="groups-page">
        <div className="groups-header">
          <h2>Your Groups</h2>
        </div>
        <p>Loading groups...</p>
      </div>
    );
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

      {groups.length === 0 ? (
        <p className="empty-text">
          No groups yet. Create your first group above.
        </p>
      ) : (
        <ul className="groups-list">
          {groups.map((g) => {
            const isEditing = editingId === g.id;
            return (
              <li key={g.id} className="groups-list-item">
                <div className="group-main">
                  {isEditing ? (
                    <input
                      className="group-edit-input"
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      disabled={savingEdit}
                    />
                  ) : (
                    <span className="group-name">{g.name || "Untitled"}</span>
                  )}
                </div>

                <div className="group-actions">
                  {isEditing ? (
                    <>
                      <button
                        className="save-group-button"
                        onClick={() => saveEdit(g)}
                        disabled={savingEdit}
                        type="button"
                      >
                        {savingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="cancel-group-button"
                        onClick={cancelEdit}
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="edit-group-button"
                        onClick={() => startEdit(g)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="open-group-button"
                        onClick={() => onOpenGroup(g)}
                        type="button"
                      >
                        Open
                      </button>
                      <button
                        className="delete-group-button"
                        onClick={() => handleDeleteGroup(g.id)}
                        type="button"
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
  );
}

export default GroupsPage;
