// src/components/calendar/TournamentCalendar.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  MapPin,
  Users,
  Trophy,
  Bell
} from 'lucide-react';
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import apiClient from '@/api/apiClient';
import { toast } from 'react-toastify';

/**
 * 📅 Tournament Calendar System
 * Advanced scheduling integration with:
 * - Tournament scheduling
 * - Match scheduling
 * - Event management
 * - Notification integration
 */
export default function TournamentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('month'); // month, week, day

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      const [tournamentsRes, matchesRes, eventsRes] = await Promise.all([
        apiClient.get(`/tournaments/calendar?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
        apiClient.get(`/matches/calendar?start=${startDate.toISOString()}&end=${endDate.toISOString()}`),
        apiClient.get(`/schools/me/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`)
      ]);

      setTournaments(tournamentsRes.data.data || []);
      setMatches(matchesRes.data.data || []);
      setEvents(eventsRes.data.data || []);
      
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const getAllEvents = () => {
    const allEvents = [];
    
    // Add tournaments
    tournaments.forEach(tournament => {
      allEvents.push({
        id: `tournament-${tournament.id}`,
        title: tournament.name,
        date: new Date(tournament.start_date),
        endDate: new Date(tournament.end_date),
        type: 'tournament',
        color: 'bg-yellow-500',
        icon: Trophy,
        description: `${tournament.sport} Tournament`,
        location: tournament.location,
        participants: tournament.teams?.length || 0
      });
    });

    // Add matches
    matches.forEach(match => {
      allEvents.push({
        id: `match-${match.id}`,
        title: `${match.team1_name} vs ${match.team2_name}`,
        date: new Date(match.scheduled_date),
        type: 'match',
        color: 'bg-blue-500',
        icon: Users,
        description: `${match.sport} Match`,
        location: match.venue,
        status: match.status
      });
    });

    // Add other events
    events.forEach(event => {
      allEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        date: new Date(event.date),
        type: event.type,
        color: getEventColor(event.type),
        icon: getEventIcon(event.type),
        description: event.description,
        location: event.location
      });
    });

    return allEvents.sort((a, b) => a.date - b.date);
  };

  const getEventColor = (type) => {
    const colors = {
      tournament: 'bg-yellow-500',
      match: 'bg-blue-500',
      practice: 'bg-green-500',
      meeting: 'bg-purple-500',
      exam: 'bg-red-500',
      holiday: 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getEventIcon = (type) => {
    const icons = {
      tournament: Trophy,
      match: Users,
      practice: Clock,
      meeting: Bell,
      exam: Calendar,
      holiday: MapPin
    };
    return icons[type] || Calendar;
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date) => {
    return getAllEvents().filter(event => 
      isSameDay(event.date, date)
    );
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setShowEventModal(true);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const createNewEvent = async (eventData) => {
    try {
      await apiClient.post('/schools/me/events', eventData);
      toast.success('Event created successfully!');
      loadCalendarData();
      setShowEventModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center font-semibold text-gray-600 bg-gray-50 rounded-lg">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {getDaysInMonth().map(date => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <motion.div
              key={date.toISOString()}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleDateClick(date)}
              className={`
                p-2 min-h-[80px] cursor-pointer border rounded-lg transition-all
                ${isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white' 
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600'
                }
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${isToday 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-600' 
                  : 'border-gray-200 dark:border-gray-600'
                }
                hover:shadow-md
              `}
            >
              <div className={`
                text-sm font-medium mb-1
                ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
              `}>
                {format(date, 'd')}
              </div>
              
              {/* Events for this day */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map(event => {
                  const IconComponent = event.icon;
                  return (
                    <div
                      key={event.id}
                      className={`
                        ${event.color} text-white text-xs p-1 rounded truncate
                        flex items-center gap-1
                      `}
                    >
                      <IconComponent size={10} />
                      <span className="truncate">{event.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Event Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Trophy size={20} />
            <span className="font-semibold">Tournaments</span>
          </div>
          <div className="text-2xl font-bold mt-1">{tournaments.length}</div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Users size={20} />
            <span className="font-semibold">Matches</span>
          </div>
          <div className="text-2xl font-bold mt-1">{matches.length}</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <span className="font-semibold">Events</span>
          </div>
          <div className="text-2xl font-bold mt-1">{events.length}</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell size={20} />
            <span className="font-semibold">Upcoming</span>
          </div>
          <div className="text-2xl font-bold mt-1">
            {getAllEvents().filter(e => e.date > new Date()).length}
          </div>
        </div>
      </div>

      {/* Event Modal - placeholder for detailed event view/creation */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {selectedEvent ? 'Event Details' : 'Create New Event'}
            </h3>
            
            {selectedEvent ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <selectedEvent.icon size={16} className="text-gray-600" />
                  <span className="font-semibold">{selectedEvent.title}</span>
                </div>
                <p className="text-gray-600">{selectedEvent.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>{format(selectedEvent.date, 'PPP')}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600">
                Event creation form will be implemented here...
              </div>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {!selectedEvent && (
                <button
                  onClick={() => {
                    // Implement event creation
                    toast.info('Event creation coming soon!');
                    setShowEventModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Event
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
