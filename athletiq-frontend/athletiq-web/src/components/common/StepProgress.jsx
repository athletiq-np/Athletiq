// src/components/common/StepProgress.jsx

// 🧠 ATHLETIQ - Enterprise Step Progress Component
// Visual step progress indicator for multi-step workflows

import React from "react";
import { Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const StepProgress = ({ 
  currentStep, 
  steps, 
  onStepClick, 
  completionPercentage = 0,
  errors = {}
}) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const isStepCompleted = (stepIndex) => {
    return stepIndex < getCurrentStepIndex();
  };

  const isStepCurrent = (stepIndex) => {
    return stepIndex === getCurrentStepIndex();
  };

  const hasStepError = (stepId) => {
    return errors[stepId] && errors[stepId].length > 0;
  };

  return (
    <div className="w-full py-6">
      {/* Progress Bar */}
      <div className="relative mb-8">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2 rounded-full"></div>
        <motion.div 
          className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform -translate-y-1/2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ duration: 0.3 }}
        ></motion.div>
        
        {/* Step Indicators */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = isStepCompleted(index);
            const isCurrent = isStepCurrent(index);
            const hasError = hasStepError(step.id);
            
            return (
              <motion.div
                key={step.id}
                className={`flex flex-col items-center cursor-pointer group ${
                  onStepClick ? 'hover:scale-105' : ''
                }`}
                onClick={() => onStepClick && onStepClick(step.id)}
                whileHover={{ scale: onStepClick ? 1.05 : 1 }}
                whileTap={{ scale: onStepClick ? 0.95 : 1 }}
              >
                {/* Step Circle */}
                <motion.div
                  className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-all duration-200 mb-2
                    ${isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent 
                        ? hasError
                          ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
                    }
                  `}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : hasError && isCurrent ? (
                    <AlertCircle size={16} />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                  
                  {/* Pulse animation for current step */}
                  {isCurrent && !hasError && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-blue-400 opacity-30"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                {/* Step Label */}
                <div className="text-center">
                  <motion.p
                    className={`
                      text-xs font-medium transition-colors duration-200
                      ${isCompleted 
                        ? 'text-green-600 dark:text-green-400' 
                        : isCurrent 
                          ? hasError
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    `}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    {step.title}
                  </motion.p>
                  
                  {/* Error indicator */}
                  {hasError && isCurrent && (
                    <motion.p
                      className="text-xs text-red-500 mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      {errors[step.id].length} error{errors[step.id].length > 1 ? 's' : ''}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Step Description */}
      <motion.div
        className="text-center"
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {steps.find(step => step.id === currentStep)?.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {steps.find(step => step.id === currentStep).description}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default StepProgress;
