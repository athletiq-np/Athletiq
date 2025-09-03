// src/components/features/organization/sections/DocumentsManagement.jsx

import React from 'react';
import { FaFileAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export default function DocumentsManagement({ data, loading, error, onRefresh, onDataUpdate }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <FaFileAlt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('organization.documents.title', 'Documents Management')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {t('organization.documents.comingSoon', 'Document management features coming soon...')}
        </p>
      </div>
    </div>
  );
}