import * as React from "react";

// Basic dialog using portal for demonstration (replace with shadcn or Radix if using)
export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
      onClick={() => onOpenChange && onOpenChange(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onOpenChange && onOpenChange(false);
        }
      }}
      role="dialog"
      tabIndex={0}
      aria-label="Dialog backdrop"
    >
      <div 
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className }) {
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white ${className || ""}`}>
      {children}
    </div>
  );
}
export function DialogHeader({ children }) {
  return <div className="mb-4">{children}</div>;
}
export function DialogTitle({ children }) {
  return <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{children}</h2>;
}
