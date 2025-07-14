// src/components/tournament/bracket/generators/CustomHeatsGenerator.js
import { BRACKET_TYPES, MATCH_STATUS } from '../BracketTypes';
import { BracketGenerator } from './BracketGenerator';

// Helper function to format time
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2);
  return `${minutes}:${remainingSeconds.padStart(5, '0')}`;
}

// Helper function to generate final rounds
function generateFinalRounds(participants, roundName, eventType, simulateResults) {
  const finalHeat = {
    name: roundName,
    number: 1,
    teams: participants,
    results: participants.map((participant, index) => {
      let time, points;
      
      if (simulateResults) {
        // Better performance in finals
        const improvement = 0.9; // 10% improvement factor
        time = participant.rawTime * improvement;
        points = participant.points * 1.1;
      } else {
        time = participant.rawTime;
        points = participant.points;
      }
      
      return {
        ...participant,
        time: formatTime(time),
        rawTime: time,
        points: Math.floor(points),
        position: index + 1,
        rank: index + 1,
        status: simulateResults ? MATCH_STATUS.COMPLETED : MATCH_STATUS.UPCOMING,
        metadata: {
          ...participant.metadata,
          round: roundName,
          lane: index + 1
        }
      };
    }),
    date: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    time: '15:00',
    venue: 'Main Track',
    status: simulateResults ? MATCH_STATUS.COMPLETED : MATCH_STATUS.UPCOMING,
    metadata: {
      heatSize: participants.length,
      eventType,
      isCompleted: simulateResults,
      isFinal: true
    }
  };
  
  // Sort final results
  if (eventType === 'Time Trial') {
    finalHeat.results.sort((a, b) => a.rawTime - b.rawTime);
  } else {
    finalHeat.results.sort((a, b) => b.points - a.points);
  }
  
  // Update positions
  finalHeat.results.forEach((result, index) => {
    result.position = index + 1;
    result.rank = index + 1;
  });
  
  return [finalHeat];
}

export function generateCustomHeatsBracket(teams, options = {}) {
  const { simulateResults = false, heatSize = 4, eventType = 'Time Trial' } = options;
  
  const heats = [];
  const allResults = [];
  
  // Create heats
  for (let i = 0; i < teams.length; i += heatSize) {
    const heatTeams = teams.slice(i, i + heatSize);
    const heatIndex = Math.floor(i / heatSize);
    const heatName = `Heat ${heatIndex + 1}`;
    
    // Generate results for each heat
    const heatResults = heatTeams.map((team, index) => {
      let time, points, position;
      
      if (simulateResults) {
        // Simulate performance based on team ranking
        const baseTime = 120; // 2 minutes base time
        const variance = 30; // 30 second variance
        const rankingBonus = (team.ranking || 500) / 1000 * 10; // Up to 10 seconds bonus
        
        time = baseTime + Math.random() * variance - rankingBonus;
        points = Math.floor(Math.random() * 50) + 50 + Math.floor(rankingBonus);
        position = index + 1; // Will be sorted later
      } else {
        time = 120 + Math.random() * 30;
        points = Math.floor(Math.random() * 100) + 50;
        position = index + 1;
      }
      
      return {
        ...team,
        heatNumber: heatIndex + 1,
        time: formatTime(time),
        rawTime: time,
        points,
        position,
        rank: 0, // Will be calculated after sorting
        status: simulateResults ? MATCH_STATUS.COMPLETED : MATCH_STATUS.UPCOMING,
        metadata: {
          heat: heatName,
          lane: index + 1,
          eventType
        }
      };
    });
    
    // Sort heat results by time (or points depending on event type)
    if (eventType === 'Time Trial') {
      heatResults.sort((a, b) => a.rawTime - b.rawTime);
    } else {
      heatResults.sort((a, b) => b.points - a.points);
    }
    
    // Update positions within heat
    heatResults.forEach((result, index) => {
      result.position = index + 1;
    });
    
    heats.push({
      name: heatName,
      number: heatIndex + 1,
      teams: heatTeams,
      results: heatResults,
      date: new Date(Date.now() + (heatIndex * 2 * 60 * 60 * 1000)).toISOString().split('T')[0],
      time: `${10 + Math.floor(heatIndex / 2)}:${(heatIndex % 2) * 30}`,
      venue: `Track ${(heatIndex % 3) + 1}`,
      status: simulateResults ? MATCH_STATUS.COMPLETED : MATCH_STATUS.UPCOMING,
      metadata: {
        heatSize: heatResults.length,
        eventType,
        isCompleted: simulateResults
      }
    });
    
    allResults.push(...heatResults);
  }
  
  // Sort all results globally
  if (eventType === 'Time Trial') {
    allResults.sort((a, b) => a.rawTime - b.rawTime);
  } else {
    allResults.sort((a, b) => b.points - a.points);
  }
  
  // Update global ranks
  allResults.forEach((result, index) => {
    result.rank = index + 1;
  });
  
  // Generate semi-finals and finals if enough participants
  const phases = [{ name: 'Heats', heats }];
  
  if (allResults.length >= 16) {
    // Semi-finals (top 8 from heats)
    const semifinalists = allResults.slice(0, 8);
    const semiFinals = generateFinalRounds(semifinalists, 'Semi-Final', eventType, simulateResults);
    phases.push({ name: 'Semi-Finals', heats: semiFinals });
    
    // Finals (top 4 from semi-finals)
    const finalists = semiFinals.flatMap(sf => sf.results).slice(0, 4);
    const finals = generateFinalRounds(finalists, 'Final', eventType, simulateResults);
    phases.push({ name: 'Finals', heats: finals });
  }
  
  return {
    type: BRACKET_TYPES.CUSTOM_HEATS,
    teams,
    heats,
    phases,
    results: allResults,
    champion: allResults[0],
    runnerUp: allResults[1],
    third: allResults[2],
    metadata: {
      totalHeats: heats.length,
      totalParticipants: teams.length,
      teamsPerHeat: heatSize,
      eventType,
      totalPhases: phases.length,
      estimatedDuration: `${Math.ceil(heats.length / 3)} hours`,
      minVenues: 3,
      formatDescription: `Custom heats format with ${eventType} scoring system`
    }
  };
}
