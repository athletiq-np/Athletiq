import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import DarkModeToggle from '../ui/DarkModeToggle';

/**
 * 🎨 Dashboard Header Component
 * Common header component for all dashboards with dark mode toggle
 */
const DashboardHeader = ({ title, subtitle, className = '' }) => {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center justify-between p-6 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } border-b ${className}`}>
      <div>
        <h1 className={`text-2xl font-bold ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <DarkModeToggle size="sm" variant="button" />
      </div>
    </div>
  );
};

export default DashboardHeader;
