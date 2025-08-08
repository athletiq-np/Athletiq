// src/components/features/school/components/ProgressTracker.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaStar, FaCheckCircle } from 'react-icons/fa';

/**
 * Progress Tracker Component
 * Shows onboarding progress with gamification
 */
export default function ProgressTracker({ 
  onboardingTasks, 
  completionPercentage, 
  totalPoints, 
  maxPoints, 
  onTaskClick 
}) {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaRocket className="h-6 w-6 mr-3 text-purple-500" />
          Setup Progress
        </h3>
        <div className="flex items-center space-x-2">
          <FaStar className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-bold text-yellow-600">{totalPoints} / {maxPoints} pts</span>
        </div>
      </div>
      
      {/* Progress Ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-200"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 283" }}
              animate={{ strokeDasharray: `${(completionPercentage / 100) * 283} 283` }}
              transition={{ duration: 1, delay: 1 }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{completionPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {onboardingTasks.map((task, index) => (
          <motion.button
            key={task.title}
            onClick={() => onTaskClick(task.tab)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 + index * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            className={`w-full p-4 rounded-xl transition-all duration-300 border text-left ${
              task.completed 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${
                task.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <task.icon className={`h-4 w-4 ${
                  task.completed ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className={`font-medium ${
                  task.completed ? 'text-green-800 dark:text-green-200' : 'text-gray-900 dark:text-white'
                }`}>
                  {task.title}
                </div>
                <div className={`text-sm ${
                  task.completed ? 'text-green-600 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {task.description}
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    task.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {task.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">{task.estimatedTime}</span>
                  <span className="text-xs font-bold text-purple-600">+{task.points} pts</span>
                </div>
              </div>
              {task.completed && (
                <FaCheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
