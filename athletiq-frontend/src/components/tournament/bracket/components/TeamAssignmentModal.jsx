// src/components/tournament/bracket/components/TeamAssignmentModal.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUsers, FaSort, FaRandom, FaSave, FaTimes, FaArrowUp, FaArrowDown,
  FaGripVertical, FaInfoCircle, FaExchangeAlt
} from 'react-icons/fa';

const TeamAssignmentModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  teams = [],
  assignments = [],
  bracketType,
  maxTeams 
}) => {
  const [assignedTeams, setAssignedTeams] = useState(() => {
    // Initialize with existing assignments or empty slots
    const slots = [];
    for (let i = 0; i < maxTeams; i++) {
      const assignment = assignments.find(a => a.position === i);
      slots.push(assignment ? assignment.team : null);
    }
    return slots;
  });

  const [availableTeams, setAvailableTeams] = useState(() => {
    const assigned = assignments.map(a => a.team?.id).filter(Boolean);
    return teams.filter(team => !assigned.includes(team.id));
  });

  const [draggedTeam, setDraggedTeam] = useState(null);

  const handleDragStart = (e, team, fromSlot = null) => {
    setDraggedTeam({ team, fromSlot });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toSlot) => {
    e.preventDefault();
    if (!draggedTeam) return;

    const { team, fromSlot } = draggedTeam;
    const newAssignedTeams = [...assignedTeams];
    const newAvailableTeams = [...availableTeams];

    if (fromSlot !== null) {
      // Moving from slot to slot
      const existingTeam = newAssignedTeams[toSlot];
      newAssignedTeams[toSlot] = team;
      newAssignedTeams[fromSlot] = existingTeam;
    } else {
      // Moving from available to slot
      const existingTeam = newAssignedTeams[toSlot];
      newAssignedTeams[toSlot] = team;
      
      // Remove from available
      const teamIndex = newAvailableTeams.findIndex(t => t.id === team.id);
      if (teamIndex > -1) {
        newAvailableTeams.splice(teamIndex, 1);
      }
      
      // Add existing team back to available if there was one
      if (existingTeam) {
        newAvailableTeams.push(existingTeam);
      }
    }

    setAssignedTeams(newAssignedTeams);
    setAvailableTeams(newAvailableTeams);
    setDraggedTeam(null);
  };

  const handleDropToAvailable = (e) => {
    e.preventDefault();
    if (!draggedTeam || draggedTeam.fromSlot === null) return;

    const { team, fromSlot } = draggedTeam;
    const newAssignedTeams = [...assignedTeams];
    const newAvailableTeams = [...availableTeams];

    newAssignedTeams[fromSlot] = null;
    newAvailableTeams.push(team);

    setAssignedTeams(newAssignedTeams);
    setAvailableTeams(newAvailableTeams);
    setDraggedTeam(null);
  };

  const moveTeam = (fromSlot, toSlot) => {
    const newAssignedTeams = [...assignedTeams];
    const temp = newAssignedTeams[fromSlot];
    newAssignedTeams[fromSlot] = newAssignedTeams[toSlot];
    newAssignedTeams[toSlot] = temp;
    setAssignedTeams(newAssignedTeams);
  };

  const randomizeAssignments = () => {
    const allTeams = [...availableTeams, ...assignedTeams.filter(Boolean)];
    const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
    
    const newAssignedTeams = [];
    for (let i = 0; i < maxTeams; i++) {
      newAssignedTeams.push(shuffled[i] || null);
    }
    
    setAssignedTeams(newAssignedTeams);
    setAvailableTeams(shuffled.slice(maxTeams));
  };

  const handleSave = () => {
    const finalAssignments = assignedTeams.map((team, index) => ({
      position: index,
      team: team,
      seed: index + 1
    })).filter(assignment => assignment.team !== null);

    onSave(finalAssignments);
  };

  const TeamCard = ({ team, isDragging = false }) => (
    <div 
      className={`p-3 bg-white border rounded-lg shadow-sm cursor-move transition-all ${
        isDragging ? 'opacity-50' : 'hover:shadow-md'
      }`}
      draggable
      onDragStart={(e) => handleDragStart(e, team)}
    >
      <div className="flex items-center space-x-3">
        <FaGripVertical className="text-gray-400" />
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{team.name}</h4>
          {team.school && (
            <p className="text-sm text-gray-500">{team.school}</p>
          )}
        </div>
      </div>
    </div>
  );

  const SlotCard = ({ slot, team, onMove }) => (
    <div 
      className={`p-4 border-2 border-dashed rounded-lg transition-all ${
        team 
          ? 'border-blue-300 bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, slot)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-500">#{slot + 1}</span>
          {team ? (
            <div 
              className="flex-1 cursor-move"
              draggable
              onDragStart={(e) => handleDragStart(e, team, slot)}
            >
              <h4 className="font-medium text-gray-900">{team.name}</h4>
              {team.school && (
                <p className="text-sm text-gray-500">{team.school}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 italic">Drop team here</p>
          )}
        </div>
        
        {team && (
          <div className="flex items-center space-x-1">
            {slot > 0 && (
              <button
                onClick={() => moveTeam(slot, slot - 1)}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Move up"
              >
                <FaArrowUp className="w-3 h-3" />
              </button>
            )}
            {slot < maxTeams - 1 && (
              <button
                onClick={() => moveTeam(slot, slot + 1)}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Move down"
              >
                <FaArrowDown className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FaUsers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Team Assignment</h2>
              <p className="text-gray-600">Arrange teams in bracket positions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={randomizeAssignments}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center space-x-2"
            >
              <FaRandom className="w-4 h-4" />
              <span>Randomize</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Available Teams */}
          <div className="w-1/3 border-r border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Teams</h3>
            <div 
              className="space-y-3 h-full overflow-y-auto"
              onDragOver={handleDragOver}
              onDrop={handleDropToAvailable}
            >
              {availableTeams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
              {availableTeams.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FaUsers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>All teams have been assigned</p>
                </div>
              )}
            </div>
          </div>

          {/* Bracket Positions */}
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bracket Positions</h3>
              <div className="text-sm text-gray-500">
                {assignedTeams.filter(Boolean).length} of {maxTeams} slots filled
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto">
              {assignedTeams.map((team, index) => (
                <SlotCard 
                  key={index} 
                  slot={index} 
                  team={team} 
                  onMove={moveTeam}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Info and Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex-1 mr-4">
              <div className="flex items-start space-x-3">
                <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Assignment Tips</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Drag teams from the left panel to bracket positions, or drag between positions to reorder.
                    Higher positions typically indicate higher seeds.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FaSave className="w-4 h-4" />
                <span>Save Assignment</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeamAssignmentModal;
