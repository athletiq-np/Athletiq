// src/components/features/school/SchoolOverview.jsx
import React from 'react';
import PremiumSchoolOverview from './PremiumSchoolOverview';

/**
 * 🏫 School Overview Component Wrapper
 * Uses the new Premium School Overview design
 */
export default function SchoolOverview(props) {
  return <PremiumSchoolOverview {...props} />;
}