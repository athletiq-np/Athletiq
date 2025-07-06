// src/components/features/tournament/TournamentSportsStep.jsx

// 🧠 ATHLETIQ - Tournament Sports Step Component (Modern UX Version)
// Advanced sports selection with drag-and-drop, filtering, categories, and animated interactions

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Search, Filter, Users, User, Trophy, Grid3x3,
  Star, Clock, Target, X, Plus, Check, ChevronDown,
  Sparkles, Zap, Award, Crown, Medal, Tag, Heart,
  Shuffle, ArrowRight, ArrowLeft, Eye, EyeOff
} from 'lucide-react';

// Import sports data
import sportsList from '@/data/sportsList';

// Categorize sports for better organization
const SPORT_CATEGORIES = {
  'Popular': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Football, Cricket, Basketball, etc.
  'Athletics': [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27], // Track & Field events
  'Aquatics': [28, 29], // Swimming events
  'Combat Sports': [9, 32, 33, 34, 38, 39, 40], // Boxing, Judo, Karate, etc.
  'Traditional': [39, 40, 41, 44, 45, 46], // Kabaddi, Wushu, Kho Kho, Chess, etc.
  'Emerging': [42, 43], // Esports, Sport Climbing
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
    let filtered = sportsList;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(sport =>
        sport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sport.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sport.formats.some(format => format.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      const categoryIds = SPORT_CATEGORIES[selectedCategory] || [];
      filtered = filtered.filter(sport => categoryIds.includes(sport.id));
    }

    // Filter by sport type
    if (sportTypeFilter !== 'all') {
      filtered = filtered.filter(sport => sport.type === sportTypeFilter);
    }

    return filtered;
  }, [searchQuery, selectedCategory, sportTypeFilter]);

  // Handle adding a sport
  const handleAddSport = (sport) => {
    const newSportInstance = {
      ...sport,
      instanceId: Date.now(), // Unique ID for React key and DND context
      // Initialize properties that will be set in TournamentConfigStep
      gender: '',
      age_group: '',
      num_participating_teams: sport.type === 'team' ? '' : null,
      team_members_total: '',
      format: '',
      tournament_type: '',
    };
    updateForm({ sports_config: [...(form.sports_config || []), newSportInstance] });
  };

  // Handle removing a sport
  const handleRemoveSport = (instanceId) => {
    const updatedSports = form.sports_config.filter(s => s.instanceId !== instanceId);
    updateForm({ sports_config: updatedSports });
  };

  // Handle drag end for reordering
  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = form.sports_config.findIndex((s) => s.instanceId === active.id);
      const newIndex = form.sports_config.findIndex((s) => s.instanceId === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSports = arrayMove(form.sports_config, oldIndex, newIndex);
        updateForm({ sports_config: reorderedSports });
      }
    }
  }

  // Handle quick add popular sports
  const handleQuickAddPopular = () => {
    const popularSports = sportsList.filter(sport => 
      SPORT_CATEGORIES['Popular'].includes(sport.id)
    ).slice(0, 5);
    
    const newSports = popularSports.map(sport => ({
      ...sport,
      instanceId: Date.now() + Math.random(),
      gender: '',
      age_group: '',
      num_participating_teams: sport.type === 'team' ? '' : null,
      team_members_total: '',
      format: '',
      tournament_type: '',
    }));

    updateForm({ sports_config: [...(form.sports_config || []), ...newSports] });
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="text-yellow-500" />
            Select Sports
          </h2>
          <p className="text-gray-600 mt-1">Choose the sports for your tournament</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAddPopular}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg
                     hover:bg-yellow-600 transition-colors duration-200"
          >
            <Sparkles size={16} />
            Quick Add Popular
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Search sports by name, type, or format..."
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              {Object.keys(SPORT_CATEGORIES).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-gray-500" />
            <select
              value={sportTypeFilter}
              onChange={(e) => setSportTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="team">Team Sports</option>
              <option value="individual">Individual Sports</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Grid3x3 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Selected Sports Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Award className="text-blue-500" />
            Selected Sports ({form.sports_config?.length || 0})
          </h3>
          {form.sports_config?.length > 0 && (
            <button
              onClick={() => updateForm({ sports_config: [] })}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl min-h-[100px] bg-gray-50">
          {form.sports_config?.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={form.sports_config.map(s => s.instanceId)} 
                strategy={rectSortingStrategy}
              >
                <div className="flex flex-wrap gap-3">
                  <AnimatePresence>
                    {form.sports_config.map(sport => (
                      <SortableSportChip
                        key={sport.instanceId}
                        id={sport.instanceId}
                        sport={sport}
                        onRemove={handleRemoveSport}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 py-8">
              <Trophy className="mb-2 opacity-50" size={48} />
              <p className="text-lg font-medium">No sports selected yet</p>
              <p className="text-sm">Click on sports below to add them</p>
            </div>
          )}
        </div>
      </div>

      {/* Available Sports Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Available Sports ({filteredSports.length})
        </h3>
        
        {filteredSports.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            variants={containerVariants}
          >
            {filteredSports.map(sport => (
              <SportCard
                key={sport.id}
                sport={sport}
                isSelected={selectedSportIds.includes(sport.id)}
                onAdd={handleAddSport}
                onRemove={(id) => {
                  const sportToRemove = form.sports_config.find(s => s.id === id);
                  if (sportToRemove) {
                    handleRemoveSport(sportToRemove.instanceId);
                  }
                }}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Search className="mx-auto mb-4 opacity-50" size={48} />
            <p className="text-lg font-medium">No sports found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={prevStep}
          className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg
                   hover:bg-gray-300 transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          Previous
        </button>
        
        <div className="text-sm text-gray-500">
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
    </motion.div>
  );
}
