import React from 'react';

export type Tab = "map" | "list" | "collections"

interface TabButtonProps {
  tab: Tab;
  label: string;
  activeTab: Tab;
  onClick: (tab: Tab) => void;
}

export const TabButton: React.FC<TabButtonProps> = ({ tab, label, activeTab, onClick }) => (
  <button
    className={`py-1 px-3 mt-1 text-sm ${
      activeTab === tab
        ? "bg-primary text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    } rounded-t-lg`}
    onClick={() => onClick(tab)}
  >
    {label}
  </button>
);
