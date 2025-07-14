// src/components/features/tournament/TournamentCreationCard.jsx

// 🏆 ATHLETIQ - Modern Tournament Creation Card
// Quick access component for tournament creation from dashboards

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Calendar, Users, Star, Sparkles, ArrowRight,
  Plus, Target, Crown, Medal, Zap
} from 'lucide-react';

const TournamentCreationCard = ({ userRole = 'admin', className = '' }) => {
  const navigate = useNavigate();
  
  const basePath = userRole === 'school' ? '/school' : '/admin';
  
  const handleCreateTournament = () => {
    navigate(`${basePath}/tournaments/create`);
  };

  return (
    <motion.div
      className={`relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 
                 rounded-2xl border-2 border-blue-100 hover:border-blue-200 
                 transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-4 right-4 text-6xl">🏆</div>
        <div className="absolute bottom-4 left-4 text-4xl">⚽</div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-30">
          🥇
        </div>
      </div>

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Tournament
            </h3>
            <p className="text-sm text-gray-600">Start organizing your next competition</p>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>Modern step-by-step wizard</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-green-500" />
            <span>Multiple sports support</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Target className="w-4 h-4 text-purple-500" />
            <span>Auto-bracket generation</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-orange-500" />
            <span>Flexible scheduling options</span>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          onClick={handleCreateTournament}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white 
                   py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl 
                   transition-all duration-200 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          Create New Tournament
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">4</div>
            <div className="text-xs text-gray-600">Easy Steps</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">46+</div>
            <div className="text-xs text-gray-600">Sports</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">∞</div>
            <div className="text-xs text-gray-600">Possibilities</div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-2 right-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="text-yellow-400 opacity-60"
        >
          <Crown className="w-6 h-6" />
        </motion.div>
      </div>
      
      <div className="absolute bottom-2 right-2">
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-green-400 opacity-60"
        >
          <Medal className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TournamentCreationCard;
