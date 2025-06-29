// src/components/Tabs.js
import React from 'react';

export default function Tabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tabs-container">
      <div className="tabs">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tab-button ${activeTab === tab.label ? 'active' : ''}`}
            onClick={() => onTabChange(tab.label)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
