import React from 'react';

const VerificationStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'verified':
        return {
          color: 'bg-green-100 text-green-800',
          text: 'Verified',
          icon: '✓'
        };
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          text: 'Pending',
          icon: '⏳'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800',
          text: 'Rejected',
          icon: '✗'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          text: 'Unknown',
          icon: '?'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.text}
    </span>
  );
};

export default VerificationStatusBadge;
