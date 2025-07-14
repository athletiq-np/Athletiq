// src/components/tournament/bracket/generators/BracketGenerator.js
import { BRACKET_TYPES, MATCH_STATUS } from '../BracketTypes';
import { generateKnockoutBracket } from './KnockoutGenerator';
import { generateDoubleEliminationBracket } from './DoubleEliminationGenerator';
import { generateRoundRobinBracket } from './RoundRobinGenerator';
import { generateGroupKnockoutBracket } from './GroupKnockoutGenerator';
import { generateCustomHeatsBracket } from './CustomHeatsGenerator';

export class BracketGenerator {
  static generateBracket(type, teams, options = {}) {
    const { assignmentMode = 'random', roundDates = [], roundNames = [] } = options;
    // Process teams based on assignment mode
    const processedTeams = this.processTeams(teams, assignmentMode);
    let bracket;
    switch (type) {
      case BRACKET_TYPES.KNOCKOUT:
        bracket = generateKnockoutBracket(processedTeams, options);
        break;
      case BRACKET_TYPES.DOUBLE_ELIMINATION:
        bracket = generateDoubleEliminationBracket(processedTeams, options);
        break;
      case BRACKET_TYPES.ROUND_ROBIN:
        bracket = generateRoundRobinBracket(processedTeams, options);
        break;
      case BRACKET_TYPES.GROUP_KNOCKOUT:
        bracket = generateGroupKnockoutBracket(processedTeams, options);
        break;
      case BRACKET_TYPES.CUSTOM_HEATS:
        bracket = generateCustomHeatsBracket(processedTeams, options);
        break;
      default:
        throw new Error(`Unknown bracket type: ${type}`);
    }
    // Add round metadata for UI rendering (for screenshot-style columns)
    if (bracket && bracket.rounds) {
      bracket.rounds = bracket.rounds.map((round, idx) => ({
        ...round,
        name: roundNames[idx] || this.getRoundName(idx + 1, bracket.rounds.length),
        date: roundDates[idx] || null
      }));
    }
    // For main/losers brackets (double elimination), add round metadata
    if (bracket && bracket.winnersBracket && bracket.winnersRounds) {
      bracket.winnersRounds = bracket.winnersRounds.map((round, idx) => ({
        ...round,
        name: roundNames[idx] || `Winners Round ${idx + 1}`,
        date: roundDates[idx] || null
      }));
    }
    if (bracket && bracket.losersBracket && bracket.losersRounds) {
      bracket.losersRounds = bracket.losersRounds.map((round, idx) => ({
        ...round,
        name: roundNames[idx + (bracket.winnersRounds?.length || 0)] || `Losers Round ${idx + 1}`,
        date: roundDates[idx + (bracket.winnersRounds?.length || 0)] || null
      }));
    }
    return bracket;
  }

  static processTeams(teams, assignmentMode) {
    let processedTeams = [...teams];
    
    switch (assignmentMode) {
      case 'random':
        processedTeams = this.randomizeTeams(processedTeams);
        break;
      case 'seeded':
        processedTeams = this.seedTeams(processedTeams);
        break;
      case 'manual':
        // Teams are already in manual order
        break;
      default:
        processedTeams = this.randomizeTeams(processedTeams);
    }
    
    return processedTeams;
  }

  static randomizeTeams(teams) {
    const shuffled = [...teams];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.map((team, index) => ({
      ...team,
      seed: index + 1
    }));
  }

  static seedTeams(teams) {
    return teams
      .sort((a, b) => (b.ranking || 0) - (a.ranking || 0))
      .map((team, index) => ({
        ...team,
        seed: index + 1
      }));
  }

  static generateDummyTeams(count) {
    const schoolNames = [
      'Riverside High', 'Oak Valley Academy', 'Sunset Secondary', 'Pine Ridge School',
      'Valley View High', 'Mountain Peak Academy', 'Lakeside Secondary', 'Forest Hills High',
      'Meadowbrook School', 'Eastview Academy', 'Westfield High', 'Northpoint Secondary',
      'Southgate Academy', 'Central Valley High', 'Hillcrest School', 'Brookstone Academy',
      'Greenwood High', 'Silverstone Academy', 'Maple Ridge School', 'Golden Gate High',
      'Thornfield Academy', 'Willowbrook High', 'Clearwater School', 'Redwood Academy'
    ];

    const teams = [];
    for (let i = 1; i <= count; i++) {
      teams.push({
        id: i,
        name: `Team ${String.fromCharCode(64 + i)}`,
        school: schoolNames[i - 1] || `School ${i}`,
        seed: i,
        ranking: Math.floor(Math.random() * 1000) + 500,
        logo: `https://via.placeholder.com/40x40/3B82F6/FFFFFF?text=${String.fromCharCode(64 + i)}`,
        stats: {
          wins: 0,
          losses: 0,
          draws: 0,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          played: 0
        },
        roster: Array.from({ length: 11 + Math.floor(Math.random() * 7) }, (_, j) => ({
          id: `${i}-${j + 1}`,
          name: `Player ${j + 1}`,
          position: j < 2 ? 'GK' : j < 8 ? 'DEF' : j < 14 ? 'MID' : 'FWD',
          number: j + 1,
          goals: Math.floor(Math.random() * 5),
          assists: Math.floor(Math.random() * 3)
        }))
      });
    }
    
    return teams;
  }

  static getRoundName(roundNumber, totalRounds) {
    const roundsFromEnd = totalRounds - roundNumber + 1;
    switch (roundsFromEnd) {
      case 1: return 'Final';
      case 2: return 'Semi-Final';
      case 3: return 'Quarter-Final';
      case 4: return 'Round of 16';
      case 5: return 'Round of 32';
      default: return `Round ${roundNumber}`;
    }
  }

  static generateMatchId(roundNumber, matchNumber, bracket = 'main') {
    return `${bracket}-${roundNumber}-${matchNumber}`;
  }

  static simulateMatchResult(team1, team2) {
    const team1Strength = team1.ranking || 500;
    const team2Strength = team2.ranking || 500;
    
    // Calculate probability based on strength difference
    const strengthDiff = team1Strength - team2Strength;
    const team1WinProbability = 0.5 + (strengthDiff / 2000);
    
    const random = Math.random();
    let winner, loser, score1, score2;
    
    if (random < team1WinProbability) {
      winner = team1;
      loser = team2;
      score1 = Math.floor(Math.random() * 3) + 1;
      score2 = Math.floor(Math.random() * score1);
    } else {
      winner = team2;
      loser = team1;
      score2 = Math.floor(Math.random() * 3) + 1;
      score1 = Math.floor(Math.random() * score2);
    }
    
    return { winner, loser, score1, score2 };
  }
}
