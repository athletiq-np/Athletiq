// You can replace this with your preferred button style later
import React from "react";

export function Button({ children, onClick, className = "", ...props }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
