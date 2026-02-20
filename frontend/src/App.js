// src/App.js
import React, { useState } from "react";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import "./styles/App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("groups");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleOpenGroup = (group) => {
    setSelectedGroup(group);
    setCurrentPage("groupDetail");
  };

  const handleBackToGroups = () => {
    setCurrentPage("groups");
    setSelectedGroup(null);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Bill Split &amp; Settle</h1>

      {currentPage === "groups" && (
        <GroupsPage onOpenGroup={handleOpenGroup} />
      )}

      {currentPage === "groupDetail" && selectedGroup && (
        <GroupDetailPage group={selectedGroup} onBack={handleBackToGroups} />
      )}
    </div>
  );
}

export default App;
