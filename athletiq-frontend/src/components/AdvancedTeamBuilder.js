import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit3, Trash2, Award, Target, TrendingUp } from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { toast } from 'react-toastify';

export default function AdvancedTeamBuilder() {
  const [teams, setTeams] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedStudent, setDraggedStudent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsRes, studentsRes] = await Promise.all([
        apiClient.get('/schools/me/teams'),
        apiClient.get('/schools/me/students')
      ]);
      
      setTeams(teamsRes.data.data || []);
      setAvailableStudents(studentsRes.data.data || []);
      setLoading(false);
      toast.success('Team data loaded successfully!');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load team data');
      setLoading(false);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    
    // Handle dropping student into team
    if (destination.droppableId.startsWith('team-')) {
      const teamId = destination.droppableId.replace('team-', '');
      const studentId = draggableId.replace('student-', '');
      
      try {
        await apiClient.post(`/schools/me/teams/${teamId}/players`, {
          playerId: studentId
        });
        
        toast.success('Student added to team!');
        loadData(); // Refresh data
      } catch (error) {
        toast.error('Failed to add student to team');
      }
    }
    
    // Handle removing student from team
    if (source.droppableId.startsWith('team-') && destination.droppableId === 'available-students') {
      const teamId = source.droppableId.replace('team-', '');
      const studentId = draggableId.replace('student-', '');
      
      try {
        await apiClient.delete(`/schools/me/teams/${teamId}/players/${studentId}`);
        
        toast.success('Student removed from team!');
        loadData(); // Refresh data
      } catch (error) {
        toast.error('Failed to remove student from team');
      }
    }
  };

  const createNewTeam = async () => {
    const teamData = {
      name: `New Team ${teams.length + 1}`,
      sport: 'General',
      sport_category: 'Mixed',
      age_group: 'U18',
      notes: 'Created via Advanced Team Builder'
    };
    
    try {
      await apiClient.post('/schools/me/teams', teamData);
      toast.success('New team created!');
      loadData();
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
            <Award className="text-blue-600" />
            Advanced Team Builder
          </h1>
          <p className="text-gray-600 mt-2">Drag and drop students to build your teams</p>
        </motion.div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Available Students Pool */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="text-green-600" />
                  Available Students ({availableStudents.length})
                </h2>
                
                <Droppable droppableId="available-students">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <AnimatePresence>
                        {availableStudents.map((student, index) => (
                          <Draggable
                            key={`student-${student.id}`}
                            draggableId={`student-${student.id}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <motion.div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={`mb-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                  snapshot.isDragging
                                    ? 'bg-blue-100 border-blue-400 shadow-lg rotate-3'
                                    : 'bg-white border-gray-200 hover:shadow-md hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {student.full_name?.charAt(0) || 'S'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">{student.full_name}</p>
                                    <p className="text-sm text-gray-500">Class {student.class}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </Draggable>
                        ))}
                      </AnimatePresence>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </motion.div>

            {/* Teams Section */}
            <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                  <Target className="text-blue-600" />
                  Teams ({teams.length})
                </h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={createNewTeam}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
                >
                  <Plus size={20} />
                  Create Team
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {teams.map((team, index) => (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden"
                    >
                      {/* Team Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg">{team.name}</h3>
                            <p className="text-blue-100 text-sm">{team.sport} • {team.sport_category}</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-1 hover:bg-white/20 rounded">
                              <Edit3 size={16} />
                            </button>
                            <button className="p-1 hover:bg-white/20 rounded">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Team Members */}
                      <Droppable droppableId={`team-${team.id}`}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`p-4 min-h-[200px] transition-colors ${
                              snapshot.isDraggingOver 
                                ? 'bg-blue-50' 
                                : 'bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-600">
                                Team Members (0)
                              </span>
                              <TrendingUp className="text-green-500" size={16} />
                            </div>
                            
                            {/* Placeholder for when team is empty */}
                            {!snapshot.isDraggingOver && (
                              <div className="text-center py-8 text-gray-400">
                                <Users size={32} className="mx-auto mb-2" />
                                <p className="text-sm">Drop students here to add to team</p>
                              </div>
                            )}
                            
                            {snapshot.isDraggingOver && (
                              <div className="text-center py-8 text-blue-500">
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ repeat: Infinity, duration: 1 }}
                                >
                                  <Target size={32} className="mx-auto mb-2" />
                                  <p className="text-sm font-medium">Drop student here!</p>
                                </motion.div>
                              </div>
                            )}
                            
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
