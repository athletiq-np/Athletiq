// src/components/features/school/components/QuickActions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { HiLightningBolt } from 'react-icons/hi';

/**
 * Quick Actions Component
 * Displays action buttons for common school management tasks
 */
export default function QuickActions({ actions, loadingStates }) {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <HiLightningBolt className="h-6 w-6 mr-3 text-yellow-500" />
        Quick Actions
      </h3>
      <div className="space-y-4">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            onClick={action.onClick}
            disabled={action.loading || loadingStates[action.loadingKey]}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="w-full group relative overflow-hidden"
          >
            <div className={`w-full bg-gradient-to-r ${action.gradient} rounded-xl p-4 shadow-lg ${action.shadowColor} border border-white/20 transition-all duration-300 group-hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  {action.loading || loadingStates[action.loadingKey] ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <action.icon className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white">{action.title}</div>
                  <div className="text-sm text-white/80">{action.description}</div>
                </div>
                <div className="text-xs text-white/60 font-mono">
                  {action.shortcut}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
