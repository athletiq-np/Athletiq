// src/components/features/organization/sections/Settings.jsx

import React from 'react';
import { FaCogs } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function Settings({ data, loading, error, onRefresh, onDataUpdate }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <FaCogs className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('organization.settings.title', 'Settings')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('organization.settings.comingSoon', 'Settings features coming soon...')}
        </p>
      </div>
    </div>
  );
}