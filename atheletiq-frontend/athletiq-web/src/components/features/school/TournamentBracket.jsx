// src/components/features/school/TournamentBracket.jsx
import React from 'react';
import { FaTrophy, FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';

export default function TournamentBracket({ tournament, matches = [] }) {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {});

  const rounds = Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b));

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    const date = new Date(dateTime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <FaTrophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bracket Generated</h3>
        <p className="text-gray-500">Tournament bracket will appear here once generated.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b">
        <h3 className="text-xl font-semibold text-gray-900">Tournament Bracket</h3>
        <p className="text-gray-600 mt-1">{tournament.name} - {tournament.format}</p>
      </div>

      <div className="p-6">
        {tournament.format === 'round_robin' ? (
          <RoundRobinBracket matches={matches} />
        ) : (
          <KnockoutBracket matchesByRound={matchesByRound} rounds={rounds} />
        )}
      </div>
    </div>
  );
}

function KnockoutBracket({ matchesByRound, rounds }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-8 min-w-fit">
        {rounds.map((round, roundIndex) => (
          <div key={round} className="flex-shrink-0">
            <h4 className="text-lg font-medium text-gray-900 mb-4 text-center">
              {getRoundName(round, rounds.length)}
            </h4>
            <div className="space-y-6">
              {matchesByRound[round].map((match, matchIndex) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundRobinBracket({ matches }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}

function MatchCard({ match }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-100 text-gray-800';
      case 'live':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'TBD';
    const date = new Date(dateTime);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isWinner = (teamId) => {
    if (match.status !== 'completed' || !match.result) return false;
    return match.result.home_score > match.result.away_score 
      ? teamId === match.home_team?.id
      : teamId === match.away_team?.id;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">
          {match.code}
        </span>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(match.status)}`}>
          {match.status}
        </span>
      </div>

      <div className="space-y-3">
        {/* Home Team */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          isWinner(match.home_team?.id) 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {isWinner(match.home_team?.id) && (
              <FaTrophy className="h-4 w-4 text-yellow-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {match.home_team?.name || 'TBD'}
              </p>
              <p className="text-sm text-gray-500">
                {match.home_team?.school}
              </p>
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {match.result?.home_score ?? '-'}
          </div>
        </div>

        {/* VS */}
        <div className="text-center text-sm text-gray-500 font-medium">
          VS
        </div>

        {/* Away Team */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          isWinner(match.away_team?.id) 
            ? 'bg-green-50 border-green-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {isWinner(match.away_team?.id) && (
              <FaTrophy className="h-4 w-4 text-yellow-500" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {match.away_team?.name || 'TBD'}
              </p>
              <p className="text-sm text-gray-500">
                {match.away_team?.school}
              </p>
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {match.result?.away_score ?? '-'}
          </div>
        </div>
      </div>

      {/* Match Details */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FaCalendarAlt className="h-3 w-3" />
              <span>{formatDateTime(match.scheduled_at)}</span>
            </div>
            {match.venue && (
              <div className="flex items-center space-x-1">
                <FaMapMarkerAlt className="h-3 w-3" />
                <span>{match.venue}</span>
              </div>
            )}
          </div>
          {match.status === 'live' && (
            <div className="flex items-center space-x-1 text-green-600">
              <FaClock className="h-3 w-3" />
              <span>Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRoundName(round, totalRounds) {
  const roundNum = parseInt(round);
  const totalRoundsNum = parseInt(totalRounds);
  
  if (roundNum === totalRoundsNum) {
    return 'Final';
  } else if (roundNum === totalRoundsNum - 1) {
    return 'Semi-Final';
  } else if (roundNum === totalRoundsNum - 2) {
    return 'Quarter-Final';
  } else {
    return `Round ${roundNum}`;
  }
}
