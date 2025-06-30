// src/components/tournament-steps/TournamentSportsStep.jsx

// 🧠 ATHLETIQ - Tournament Sports Step Component (Interactive Version)
// This component has been updated to use a dedicated data file for the sports list,
// which is a better practice than hardcoding data directly in the component.

// --- MODULE IMPORTS ---
import React, { useState, useMemo, useEffect } from 'react';
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

// Corrected import path for the official sports list from our new data file
// Assuming TournamentSportsStep.jsx is at src/components/tournament-steps/
// and sportsList.js is at src/data/sportsList.js
import sportsList from '../../../data/sportsList'; // Correct relative path from tournament-steps/ to data/

// --- COMPONENT DEFINITION ---
// Helper object to map the icon names from sportsList.js to visual emojis.
// This is used to ensure the UI displays the correct emoji for each sport.
const ICONS = {
  Football: '⚽',
  Cricket: '🏏',
  Basketball: '�',
  Tennis: '🎾',
  Volleyball: '🏐',
  TableTennis: '🏓',
  Badminton: '🏸',
  Rugby: '🏉',
  BoxingGlove: '🥊',
  FieldHockey: '🏑',
  Baseball: '⚾',
  Golf: '⛳',
  Running: '🏃',       // General running icon
  Jumping: '🤸',       // General jumping icon
  Hurdles: '🚧',      // Hurdles specific
  Relay: '🏃‍♀️🏃‍♂️',  // Relay specific
  LongJump: '🤸‍♂️',    // More specific for Long Jump
  HighJump: '⬆️',    // More specific for High Jump
  ShotPut: '🔴',     // Red circle for Shot Put
  Discus: '📀',      // Disc icon for Discus
  Swimming: '🏊',
  SwimmingRelay: '🏊‍♂️🏊‍♀️', // Specific for swim relay
  Cycling: '🚴',
  Gymnastics: '🤸‍♀️',
  Judo: '🥋',
  Karate: '🥋',
  Taekwondo: '🥋',
  Weightlifting: '🏋️',
  Handball: '🤾',
  Squash: '🎾',
  Fencing: '🤺',
  Kabaddi: '🤼',
  Wushu: '🥋',
  KhoKho: '🏃‍♀️💨',
  EsportsController: '🎮',
  Climbing: '🧗',
  Chess: '♟️',
  Carrom: '⚪',
  Ludo: '🎲',
  Default: '🏆', // Fallback icon
};

/**
 * A draggable chip component for the selected sports.
 * Renders a selected sport with its icon and name, and allows for drag-and-drop reordering.
 * @param {object} props - Component props.
 * @param {string} props.id - The unique ID of the sport instance (for dnd-kit).
 * @param {string} props.name - The name of the sport.
 * @param {string} props.icon - The emoji/icon for the sport.
 */
function SortableSportChip({ id, name, icon }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 bg-athletiq-blue text-white px-3 py-1 rounded-full text-sm font-semibold"
    >
      <span className="text-lg">{icon}</span>
      {name}
    </div>
  );
}

/**
 * The main component for the Tournament Sports Step.
 * Allows users to select sports from a list, search them, and reorder selected sports.
 * @param {object} props - The props passed from the parent component.
 * @param {object} props.form - The current state of the form data.
 * @param {function} props.updateForm - The function to update the form state in the parent.
 */
export default function TournamentSportsStep({ form, updateForm }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter the available sports based on the search query from the imported sportsList
  const filteredSports = useMemo(() => {
    if (!searchQuery) return sportsList;
    return sportsList.filter(sport =>
      sport.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, sportsList]);

  /**
   * Handles adding a sport to the form state when its icon is clicked.
   * Crucially, it now passes the *entire* sport object, including formats and other details.
   * A unique 'instanceId' is added to allow for multiple selections of the same sport type.
   * @param {object} sport - The full sport object from sportsList.
   */
  const handleAddSport = (sport) => {
    const visualIcon = ICONS[sport.icon] || ICONS.Default;
    // Pass the entire sport object including its formats, team_members, etc.
    // Also attach the visualIcon from our mapping directly here.
    const newSportInstance = {
      ...sport,
      icon: visualIcon, // Use the mapped emoji
      instanceId: Date.now(), // Unique ID for React key and DND context
      // Initialize properties that will be set in TournamentConfigStep
      gender: '',
      age_group: '',
      num_participating_teams: sport.type === 'team' ? '' : null, // Initialize this field
      team_members_total: '', // This is the total roster size including subs
      format: '',             // For all sports, dynamic dropdown
      tournament_type: '',    // For all sports, dynamic dropdown
    };
    updateForm({ sports_config: [...form.sports_config, newSportInstance] });
  };

  // Setup DndContext sensors
  const sensors = useSensors(useSensor(PointerSensor));

  /**
   * Handles the end of a drag-and-drop operation for reordering selected sports.
   * @param {object} event - The dnd-kit event object.
   */
  function handleDragEnd(event) {
    const { active, over } = event;
    // Only reorder if the item was actually moved to a different position
    if (active.id !== over.id) {
      const oldIndex = form.sports_config.findIndex((s) => s.instanceId === active.id);
      const newIndex = form.sports_config.findIndex((s) => s.instanceId === over.id);
      // Use arrayMove from @dnd-kit/sortable to efficiently reorder the array
      const reorderedSports = arrayMove(form.sports_config, oldIndex, newIndex);
      updateForm({ sports_config: reorderedSports });
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">2. Select & Order Sports</h2>

      {/* Part 1: Search Bar for filtering available sports */}
      <div>
        <label htmlFor="sport-search" className="sr-only">Search Sports</label>
        <input
          type="text"
          id="sport-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="🔍 Search for a sport..."
        />
      </div>

      {/* Part 2: Grid of Available Sports (dynamically filtered from sportsList.js) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {filteredSports.map(sport => (
          <div
            key={sport.id} // Using sport.id for key as these are static options
            onClick={() => handleAddSport(sport)}
            className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-athletiq-green/10 hover:border-athletiq-green transition-colors"
            title={`Add ${sport.name}`}
          >
            <span className="text-4xl">{sport.icon}</span> {/* Icon already mapped in sportsList */}
            <span className="mt-2 text-sm text-center font-medium text-gray-700">{sport.name}</span>
          </div>
        ))}
      </div>

      {/* Part 3: Selected Sports (with Drag-and-Drop reordering) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Selected Sports (Drag to Reorder)</h3>
        <div className="p-4 border-2 border-dashed rounded-lg min-h-[80px] flex flex-wrap items-start gap-3">
          {form.sports_config.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={form.sports_config.map(s => s.instanceId)} strategy={rectSortingStrategy}>
                {form.sports_config.map(sport => (
                  <SortableSportChip
                    key={sport.instanceId} // Using the unique instanceId for dynamic list keys
                    id={sport.instanceId}
                    name={sport.name}
                    icon={sport.icon}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-gray-500">Click on a sport above to add it here.</p>
          )}
        </div>
      </div>
    </div>
  );
}
