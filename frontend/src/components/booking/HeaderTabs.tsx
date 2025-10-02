import React from "react";

export default function HeaderTabs({
  tab, canOwner, onTab,
}: {
  tab: "mine" | "owner";
  canOwner: boolean;
  onTab: (t: "mine" | "owner") => void;
}) {
  return (
    <div className="container header-row">
      <h1>📅 Reservas</h1>
      <div className="tabs">
        <button className={`tab ${tab === "mine" ? "active" : ""}`} onClick={() => onTab("mine")}>
          Mis reservas
        </button>
        {canOwner && (
          <button className={`tab ${tab === "owner" ? "active" : ""}`} onClick={() => onTab("owner")}>
            Reservas de mis sedes
          </button>
        )}
      </div>
    </div>
  );
}
