import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlay,
  FaPause,
  FaStop,
  FaClock,
  FaUsers,
  FaTrophy,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCamera,
  FaShare,
  FaHeart,
  FaComment,
  FaExpand,
  FaCompress,
  FaVolumeMute,
  FaVolumeUp,
  FaWifi,
  FaSignal,
  FaBroadcastTower
} from 'react-icons/fa';
import { formatDistanceToNow, format } from 'date-fns';
import { apiClient } from '../../utils/apiClient';
import { logger } from '../../utils/logger';

/**
 * 🏆 Live Match Tracking Component
 * Real-time tournament and match tracking with live updates
 * 
 * Features:
 * - Live match status updates via WebSocket
 * - Real-time score tracking
 * - Live commentary and events
 * - Match statistics and analytics
 * - Live streaming integration
 * - Social features (likes, comments, sharing)
 * - Mobile-optimized interface
 * - Offline support with sync
 */
export default function LiveMatchTracker({ matchId, tournamentId, autoplay = false }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [likes, setLikes] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  const wsRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);

  // Match status options
  const matchStatuses = {
    scheduled: { color: 'blue', label: 'Scheduled', icon: FaCalendarAlt },
    live: { color: 'red', label: 'Live', icon: FaBroadcastTower },
    halftime: { color: 'yellow', label: 'Half Time', icon: FaPause },
    finished: { color: 'green', label: 'Finished', icon: FaStop },
    postponed: { color: 'gray', label: 'Postponed', icon: FaClock },
    cancelled: { color: 'red', label: 'Cancelled', icon: FaStop }
  };

  useEffect(() => {
    loadMatchData();
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [matchId]);

  useEffect(() => {
    if (autoplay && match?.status === 'live') {
      setIsLive(true);
    }
  }, [match, autoplay]);

  const loadMatchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/matches/${matchId}/live`);
      setMatch(response.data.match);
      setLiveEvents(response.data.events || []);
      setComments(response.data.comments || []);
      setLikes(response.data.likes || 0);
      setIsFollowing(response.data.isFollowing || false);
      
      logger.info('Match data loaded', { matchId, status: response.data.match?.status });

    } catch (error) {
      logger.error('Failed to load match data', error);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('athletiq_token');
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:5000'}/matches/${matchId}?token=${token}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        logger.info('Match WebSocket connected', { matchId });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message', error);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        logger.info('Match WebSocket disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error');
        logger.error('WebSocket error', error);
      };

    } catch (error) {
      logger.error('Failed to connect WebSocket', error);
      setConnectionStatus('error');
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'match_update':
        setMatch(prev => ({ ...prev, ...data.match }));
        break;
        
      case 'live_event':
        setLiveEvents(prev => [data.event, ...prev]);
        playEventSound(data.event.type);
        break;
        
      case 'comment':
        setComments(prev => [data.comment, ...prev]);
        break;
        
      case 'like_update':
        setLikes(data.count);
        break;
        
      case 'viewer_count':
        setViewerCount(data.count);
        break;
        
      case 'status_change':
        setMatch(prev => ({ ...prev, status: data.status }));
        if (data.status === 'live') {
          setIsLive(true);
        }
        break;
        
      default:
        logger.warn('Unknown WebSocket message type', { type: data.type });
    }
  };

  const playEventSound = (eventType) => {
    if (!isMuted && audioRef.current) {
      // Different sounds for different events
      const soundMap = {
        goal: '/sounds/goal.mp3',
        card: '/sounds/whistle.mp3',
        timeout: '/sounds/timeout.mp3',
        halftime: '/sounds/halftime.mp3',
        fulltime: '/sounds/fulltime.mp3'
      };
      
      const soundFile = soundMap[eventType] || '/sounds/event.mp3';
      audioRef.current.src = soundFile;
      audioRef.current.play().catch(() => {
        // Audio play failed, ignore
      });
    }
  };

  const handleLike = async () => {
    try {
      await apiClient.post(`/matches/${matchId}/like`);
      // WebSocket will handle the update
    } catch (error) {
      logger.error('Failed to like match', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await apiClient.delete(`/matches/${matchId}/follow`);
      } else {
        await apiClient.post(`/matches/${matchId}/follow`);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      logger.error('Failed to toggle follow', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await apiClient.post(`/matches/${matchId}/comments`, {
        text: newComment.trim()
      });
      setNewComment('');
      // WebSocket will handle the update
    } catch (error) {
      logger.error('Failed to post comment', error);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const shareMatch = async () => {
    const shareData = {
      title: `${match.team1.name} vs ${match.team2.name}`,
      text: `Watch live: ${match.team1.name} vs ${match.team2.name}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareData.url);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <FaSignal className="text-green-500" />;
      case 'connecting':
        return <FaWifi className="text-yellow-500 animate-pulse" />;
      case 'disconnected':
      case 'error':
        return <FaSignal className="text-red-500" />;
      default:
        return <FaWifi className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-athletiq-blue border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Loading live match...</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Match not found</h3>
        <p className="text-gray-600">The requested match could not be found.</p>
      </div>
    );
  }

  const statusConfig = matchStatuses[match.status] || matchStatuses.scheduled;

  return (
    <div ref={containerRef} className={`bg-white rounded-xl shadow-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-athletiq-blue to-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-${statusConfig.color}-500`}>
              <statusConfig.icon className="w-4 h-4" />
              <span className="font-medium">{statusConfig.label}</span>
              {match.status === 'live' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
            </div>
            {viewerCount > 0 && (
              <div className="flex items-center space-x-1 text-sm opacity-90">
                <FaUsers className="w-4 h-4" />
                <span>{viewerCount.toLocaleString()} watching</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-sm">
              {getConnectionIcon()}
            </div>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              {isMuted ? <FaVolumeMute className="w-4 h-4" /> : <FaVolumeUp className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="w-16 h-16 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
              {match.team1.logo ? (
                <img src={match.team1.logo} alt={match.team1.name} className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-lg font-bold">{match.team1.name.charAt(0)}</span>
              )}
            </div>
            <h3 className="font-semibold">{match.team1.name}</h3>
          </div>
          
          <div className="text-center px-6">
            <div className="text-3xl font-bold mb-1">
              {match.score?.team1 || 0} - {match.score?.team2 || 0}
            </div>
            {match.status === 'live' && (
              <div className="text-sm opacity-90">
                <FaClock className="w-3 h-3 inline mr-1" />
                {match.elapsed_time || '0'}'
              </div>
            )}
          </div>
          
          <div className="text-center flex-1">
            <div className="w-16 h-16 mx-auto mb-2 bg-white/20 rounded-full flex items-center justify-center">
              {match.team2.logo ? (
                <img src={match.team2.logo} alt={match.team2.name} className="w-12 h-12 rounded-full" />
              ) : (
                <span className="text-lg font-bold">{match.team2.name.charAt(0)}</span>
              )}
            </div>
            <h3 className="font-semibold">{match.team2.name}</h3>
          </div>
        </div>

        {/* Match Info */}
        <div className="flex items-center justify-center space-x-4 mt-4 text-sm opacity-90">
          <div className="flex items-center space-x-1">
            <FaMapMarkerAlt className="w-3 h-3" />
            <span>{match.venue || 'TBD'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaCalendarAlt className="w-3 h-3" />
            <span>{format(new Date(match.scheduled_time), 'MMM dd, HH:mm')}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <FaHeart className={`w-5 h-5 ${likes > 0 ? 'text-red-500' : ''}`} />
              <span>{likes}</span>
            </button>
            
            <button
              onClick={handleFollow}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isFollowing 
                  ? 'bg-athletiq-blue text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaHeart className="w-4 h-4" />
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={shareMatch}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <FaShare className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Live Events */}
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FaTrophy className="w-5 h-5 text-athletiq-blue" />
            <span>Live Events</span>
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {liveEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-12 text-center">
                    <span className="text-sm font-medium text-athletiq-blue">
                      {event.minute}'
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.description}</p>
                    <p className="text-sm text-gray-600">{event.player_name}</p>
                  </div>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    {event.type === 'goal' && '⚽'}
                    {event.type === 'card' && '🟨'}
                    {event.type === 'substitution' && '🔄'}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {liveEvents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FaClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No events yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FaComment className="w-5 h-5 text-athletiq-blue" />
            <span>Live Comments</span>
          </h3>
          
          <form onSubmit={handleComment} className="mb-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-athletiq-blue focus:border-athletiq-blue"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-athletiq-blue text-white rounded-lg hover:bg-athletiq-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </form>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.user_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FaComment className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio for event sounds */}
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}
