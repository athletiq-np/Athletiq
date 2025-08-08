// src/components/features/school/components/StatsCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { MdTrendingUp } from 'react-icons/md';
import { FaEye } from 'react-icons/fa';

/**
 * Individual Stats Card Component
 * Displays statistical information with interactive features
 */
export default function StatsCard({ card, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      whileHover={{ 
        scale: 1.02, 
        rotateY: 5,
        transformPerspective: 1000 
      }}
      className="group relative cursor-pointer"
      onClick={card.drillDown}
    >
      <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden transition-all duration-300 group-hover:shadow-2xl">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <card.icon className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
              card.trend === 'up' ? 'bg-green-100 text-green-800 group-hover:bg-green-200' : 'bg-red-100 text-red-800 group-hover:bg-red-200'
            }`}>
              <MdTrendingUp className="h-3 w-3" />
              <span>{card.change}</span>
            </div>
          </div>
          
          <div className="mb-3">
            <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
              {card.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{card.title}</div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={`bg-gradient-to-r ${card.gradient} h-2 rounded-full`}
                style={{ width: `${Math.min((card.value / card.target) * 100, 100)}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((card.value / card.target) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
              ></motion.div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {card.value} / {card.target} {card.description}
            </div>
          </div>

          {/* Sub-stats */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {card.subStats.map((subStat, subIndex) => (
              <div key={subStat.label} className="bg-white/40 dark:bg-gray-700/40 rounded-lg p-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">{subStat.label}</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{subStat.value}</div>
              </div>
            ))}
          </div>

          {/* Drill-down indicator */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="p-1 bg-white/20 rounded-full">
              <FaEye className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
