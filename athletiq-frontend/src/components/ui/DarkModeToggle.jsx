import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 🌙 Dark Mode Toggle Component
 * Reusable theme toggle for all dashboard components
 */
const DarkModeToggle = ({ 
  className = '', 
  size = 'md', 
  showLabel = false,
  variant = 'button' // 'button' | 'switch'
}) => {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  if (variant === 'switch') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        )}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={toggleTheme}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <FaSun className={`w-3 h-3 text-yellow-500 transition-opacity ${theme === 'dark' ? 'opacity-0' : 'opacity-100'}`} />
            <FaMoon className={`w-3 h-3 text-blue-400 transition-opacity ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </label>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${buttonSizeClasses[size]} 
        rounded-lg 
        bg-gray-100 dark:bg-gray-700 
        text-gray-700 dark:text-gray-300 
        hover:bg-gray-200 dark:hover:bg-gray-600 
        transition-colors 
        flex items-center justify-center
        ${className}
      `}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <FaSun className={sizeClasses[size]} />
      ) : (
        <FaMoon className={sizeClasses[size]} />
      )}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

export default DarkModeToggle;
