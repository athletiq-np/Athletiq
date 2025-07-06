// src/components/features/tournament/TournamentSportsStep.jsx

// 🏀 ATHLETIQ - Modern Tournament Sports Selection Step
// Left-Right Layout: Available Sports (60%) | Selected Sports (40%)
// Features: Search, Categories, Multiple Instances, Drag-and-Drop Reordering

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Users, User, Trophy, Grid3x3,
  Star, Clock, Target, X, Plus, Check, ChevronDown,
  Sparkles, Zap, Award, Crown, Medal, Tag, Heart,
  Shuffle, ArrowRight, ArrowLeft, Eye, EyeOff, Trash2,
  Move, RotateCcw, Copy, Info
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import sports data
import sportsList from '../../../data/sportsList';

// Sports Categories for Tab Organization
const SPORT_CATEGORIES = {
  'All': 'all',
  'Popular': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Football, Cricket, Basketball, etc.
  'Team': [1, 2, 3, 4, 5, 6, 7, 8, 12], // Team sports
  'Individual': [9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27], // Individual sports
  'Athletics': [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27], // Track & Field
  'Combat': [32, 33, 34, 38, 39, 40], // Boxing, Judo, Karate, etc.
  'Water': [28, 29], // Swimming events
  'Emerging': [42, 43, 44, 45, 46], // Esports, Chess, etc.
};

// Sport Icons Mapping (using emojis for now, can be replaced with custom icons)
const SPORT_ICONS = {
  'Football': '⚽',
  'Cricket': '🏏', 
  'Basketball': '🏀',
  'Volleyball': '🏐',
  'Tennis': '🎾',
  'Table Tennis': '🏓',
  'Badminton': '🏸',
  'Hockey': '🏑',
  'Boxing': '🥊',
  'Swimming': '🏊',
  'Athletics': '🏃',
  'Chess': '♟️',
  'default': '🏆'
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  }
};

const chipVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
};

// Sortable Sport Chip Component
function SortableSportChip({ id, sport, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 
        text-white px-4 py-2 rounded-full text-sm font-semibold cursor-grab
        hover:from-blue-600 hover:to-purple-700 transition-all duration-200
        shadow-lg hover:shadow-xl transform hover:scale-105
        ${isDragging ? 'shadow-2xl z-50' : ''}
      `}
      variants={chipVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <span className="text-lg">{sport.icon}</span>
      <span className="truncate max-w-[120px]">{sport.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   hover:bg-white/20 rounded-full p-1 flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// Sport Card Component
function SportCard({ sport, isSelected, onAdd, onRemove }) {
  const isTeam = sport.type === 'team';
  const isIndividual = sport.type === 'individual';

  return (
    <motion.div
      variants={itemVariants}
      className={`
        relative group flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer
        transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1
        ${isSelected 
          ? 'border-green-500 bg-green-50 shadow-md' 
          : 'border-gray-200 hover:border-blue-400 bg-white hover:bg-blue-50'
        }
      `}
      onClick={() => isSelected ? onRemove(sport.id) : onAdd(sport)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Sport Icon */}
      <div className="text-4xl mb-2">{sport.icon}</div>
      
      {/* Sport Name */}
      <h3 className="text-sm font-semibold text-gray-800 text-center mb-1 leading-tight">
        {sport.name}
      </h3>
      
      {/* Sport Type Badge */}
      <div className={`
        flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        ${isTeam ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
      `}>
        {isTeam ? <Users size={12} /> : <User size={12} />}
        {sport.type}
      </div>
      
      {/* Selection Indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
          >
            <Check size={14} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hover Add Button */}
      <AnimatePresence>
        {!isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-blue-500/10 rounded-xl
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <div className="bg-blue-500 text-white rounded-full p-2">
              <Plus size={16} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main Component
export default function TournamentSportsStep({ form, updateForm, nextStep, prevStep }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [sportTypeFilter, setSportTypeFilter] = useState('all'); // 'all', 'team', 'individual'

  // Setup DndContext sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // Get selected sport IDs for comparison
  const selectedSportIds = useMemo(() => 
    form.sports_config?.map(s => s.id) || []
  , [form.sports_config]);

  // Filter sports based on search, category, and type
  const filteredSports = useMemo(() => {
    let filtered = sportsList.map(sport => ({
      ...sport,
      icon: SPORT_ICONS[sport.name] || SPORT_ICONS.default,
      type: sport.type || 'individual'
    }));

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(sport =>
        sport.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      const categoryIds = SPORT_CATEGORIES[selectedCategory];
      if (Array.isArray(categoryIds)) {
        filtered = filtered.filter(sport => categoryIds.includes(sport.id));
      }
    }

    // Type filter
    if (sportTypeFilter !== 'all') {
      filtered = filtered.filter(sport => sport.type === sportTypeFilter);
    }

    return filtered;
  }, [searchQuery, selectedCategory, sportTypeFilter]);

  // Handle adding a sport
  const handleAddSport = (sport) => {
    const newSport = {
      id: `sport_${sport.id}_${Date.now()}`,
      sportId: sport.id,
      name: sport.name,
      icon: sport.icon,
      type: sport.type,
      // Default configuration
      ageGroups: ['U16', 'U18', 'Open'],
      genders: ['Male', 'Female'],
      maxTeams: 16,
      format: 'knockout'
    };

    const updatedSports = [...(form.sports_config || []), newSport];
    updateForm({
      ...form,
      sports_config: updatedSports
    });
  };

  // Handle removing a sport
  const handleRemoveSport = (sportConfigId) => {
    const updatedSports = form.sports_config?.filter(s => s.id !== sportConfigId) || [];
    updateForm({
      ...form,
      sports_config: updatedSports
    });
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = form.sports_config?.findIndex(s => s.id === active.id) || 0;
      const newIndex = form.sports_config?.findIndex(s => s.id === over.id) || 0;
      
      const newSports = arrayMove(form.sports_config || [], oldIndex, newIndex);
      updateForm({
        ...form,
        sports_config: newSports
      });
    }
  };

  // Quick actions
  const clearAll = () => {
    updateForm({
      ...form,
      sports_config: []
    });
  };

  const addPopularSports = () => {
    const popularSports = filteredSports.filter(sport => 
      SPORT_CATEGORIES.Popular.includes(sport.id) && 
      !selectedSportIds.includes(`sport_${sport.id}_*`)
    );
    
    popularSports.forEach(sport => {
      if (!form.sports_config?.some(s => s.sportId === sport.id)) {
        handleAddSport(sport);
      }
    });
  };

  // Stats
  const stats = useMemo(() => {
    const totalSports = form.sports_config?.length || 0;
    const teamSports = form.sports_config?.filter(s => s.type === 'team').length || 0;
    const individualSports = form.sports_config?.filter(s => s.type === 'individual').length || 0;
    
    return { totalSports, teamSports, individualSports };
  }, [form.sports_config]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Select Sports</h2>
            <p className="text-gray-600 mt-1">
              Choose the sports for your tournament. You can configure each sport individually.
            </p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Total: {stats.totalSports}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              Team: {stats.teamSports}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">
              Individual: {stats.individualSports}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Left-Right Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Panel - Available Sports (60%) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Search and Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           transition-colors duration-200"
                />
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors duration-200 ${
                  showFilters 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-5 w-5" />
                Filters
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                  Grid
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="flex flex-wrap gap-4">
                    
                    {/* Sport Type Filter */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Type:</label>
                      <select
                        value={sportTypeFilter}
                        onChange={(e) => setSportTypeFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm 
                                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="team">Team Sports</option>
                        <option value="individual">Individual Sports</option>
                      </select>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={addPopularSports}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 
                                 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm"
                      >
                        <Sparkles className="h-4 w-4" />
                        Add Popular
                      </button>
                      <button
                        onClick={clearAll}
                        className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 
                                 rounded-lg hover:bg-red-200 transition-colors duration-200 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear All
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Category Tabs */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(SPORT_CATEGORIES).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Sports Grid */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filteredSports.map(sport => (
                <SportCard
                  key={sport.id}
                  sport={sport}
                  isSelected={form.sports_config?.some(s => s.sportId === sport.id)}
                  onAdd={handleAddSport}
                  onRemove={() => {
                    const sportConfig = form.sports_config?.find(s => s.sportId === sport.id);
                    if (sportConfig) {
                      handleRemoveSport(sportConfig.id);
                    }
                  }}
                />
              ))}
            </motion.div>

            {/* No Results */}
            {filteredSports.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search size={48} className="mx-auto" />
                </div>
                <p className="text-gray-600 text-lg">No sports found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Selected Sports (40%) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Selected Sports</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {form.sports_config?.length || 0} selected
                </span>
                {form.sports_config?.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Selected Sports List */}
            {form.sports_config?.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={form.sports_config.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {form.sports_config.map((sport) => (
                      <SortableSportChip
                        key={sport.id}
                        id={sport.id}
                        sport={sport}
                        onRemove={handleRemoveSport}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Trophy size={48} className="mx-auto" />
                </div>
                <p className="text-gray-600 text-lg">No sports selected</p>
                <p className="text-gray-500 text-sm mt-2">
                  Click on sports from the left to add them
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={prevStep}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg 
                   hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Step 2 of 4
          </div>
          <button
            onClick={nextStep}
            disabled={!form.sports_config?.length}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
                     transition-colors duration-200"
          >
            Next
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
