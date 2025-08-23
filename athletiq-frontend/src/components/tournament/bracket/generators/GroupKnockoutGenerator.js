// src/components/tournament/bracket/generators/GroupKnockoutGenerator.js
import { BRACKET_TYPES, MATCH_STATUS } from '../BracketTypes';
import { BracketGenerator } from './BracketGenerator';
import { generateRoundRobinBracket } from './RoundRobinGenerator';
import { generateKnockoutBracket } from './KnockoutGenerator';

export function generateGroupKnockoutBracket(teams, options = {}) {
  const { simulateResults = false, groupSize = 4 } = options;
  
  const groups = [];
  const qualifiers = [];
  
  // Create groups
  for (let i = 0; i < teams.length; i += groupSize) {
    const groupTeams = teams.slice(i, i + groupSize);
    const groupIndex = Math.floor(i / groupSize);
    const groupName = `Group ${String.fromCharCode(65 + groupIndex)}`;
    
    // Generate round robin for each group
    const groupBracket = generateRoundRobinBracket(groupTeams, { simulateResults });
    
    // Get top 2 teams from each group
    const groupQualifiers = groupBracket.standings.slice(0, 2);
    qualifiers.push(...groupQualifiers);
    
    groups.push({
      name: groupName,
      letter: String.fromCharCode(65 + groupIndex),
      teams: groupTeams,
      matches: groupBracket.matches,
      rounds: groupBracket.rounds,
      standings: groupBracket.standings,
      qualifiers: groupQualifiers,
      winner: groupBracket.standings[0],
      runnerUp: groupBracket.standings[1],
      metadata: {
        totalMatches: groupBracket.matches.length,
        completedMatches: groupBracket.matches.filter(m => m.status === MATCH_STATUS.COMPLETED).length,
        isCompleted: groupBracket.matches.every(m => m.status === MATCH_STATUS.COMPLETED)
      }
    });
  }
  
  // Generate knockout stage with qualifiers
  const knockoutBracket = generateKnockoutBracket(qualifiers, { simulateResults });
  
  // Calculate total matches and duration
  const groupMatches = groups.reduce((sum, group) => sum + group.matches.length, 0);
  const knockoutMatches = knockoutBracket.rounds.reduce((sum, round) => sum + round.matches.length, 0);
  
  return {
    type: BRACKET_TYPES.GROUP_KNOCKOUT,
    teams,
    groups,
    knockoutBracket,
    qualifiers,
    champion: knockoutBracket.champion,
    runnerUp: knockoutBracket.rounds[knockoutBracket.rounds.length - 1]?.matches[0]?.loser,
    metadata: {
      totalMatches: groupMatches + knockoutMatches,
      totalRounds: Math.max(...groups.map(g => g.rounds.length)) + knockoutBracket.rounds.length,
      groupStage: {
        totalGroups: groups.length,
        teamsPerGroup: groupSize,
        qualifiersPerGroup: 2,
        totalMatches: groupMatches
      },
      knockoutStage: {
        totalTeams: qualifiers.length,
        totalMatches: knockoutMatches,
        totalRounds: knockoutBracket.rounds.length
      },
      estimatedDuration: `${Math.max(...groups.map(g => g.rounds.length)) + knockoutBracket.rounds.length} days`,
      minVenues: 6,
      formatDescription: 'Group stage followed by knockout tournament with top teams from each group'
    }
  };
}
