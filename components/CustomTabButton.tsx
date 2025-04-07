import React from 'react';

interface CustomTabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const CustomTabButton: React.FC<CustomTabButtonProps> = ({ isActive, onClick, children }) => (
  <button
    className={`py-2 px-4 ${
      isActive
        ? "bg-blue-500 text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
    } rounded-lg`}
    onClick={onClick}
  >
    {children}
  </button>
);

export default CustomTabButton;
