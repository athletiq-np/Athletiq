import React from 'react';

const ProfileCompletionCircle = ({ percentage, size = 'md' }) => {
  // Ensure percentage is a valid number and provide fallback
  const validPercentage = isNaN(percentage) || percentage == null ? 0 : Math.max(0, Math.min(100, percentage));
  const getSizeConfig = (size) => {
    switch (size) {
      case 'sm':
        return {
          containerSize: 'w-8 h-8',
          textSize: 'text-xs',
          strokeWidth: 2
        };
      case 'lg':
        return {
          containerSize: 'w-16 h-16',
          textSize: 'text-sm',
          strokeWidth: 3
        };
      default: // md
        return {
          containerSize: 'w-12 h-12',
          textSize: 'text-xs',
          strokeWidth: 2.5
        };
    }
  };

  const getColorFromPercentage = (percentage) => {
    if (percentage >= 80) return '#10B981'; // green-500
    if (percentage >= 50) return '#F59E0B'; // amber-500
    return '#EF4444'; // red-500
  };

  const config = getSizeConfig(size);
  const color = getColorFromPercentage(validPercentage);
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;

  return (
    <div className={`relative ${config.containerSize} flex items-center justify-center`}>
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 32 32">
        {/* Background circle */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={config.strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke={color}
          strokeWidth={config.strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${config.textSize} font-medium`} style={{ color }}>
        {validPercentage}%
      </div>
    </div>
  );
};

export default ProfileCompletionCircle;
