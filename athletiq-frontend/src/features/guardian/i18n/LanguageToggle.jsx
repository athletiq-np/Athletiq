import React, { useState } from 'react';
import { FaGlobe } from 'react-icons/fa';
import { useTranslation } from './translations';

const LanguageToggle = () => {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'np' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      title={language === 'en' ? 'Switch to Nepali' : 'अंग्रेजीमा जानुहोस्'}
    >
      <FaGlobe className="text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        {language === 'en' ? 'नेपाली' : 'English'}
      </span>
    </button>
  );
};

export default LanguageToggle;
