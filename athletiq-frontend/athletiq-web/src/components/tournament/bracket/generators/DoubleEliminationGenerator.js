// src/components/tournament/bracket/generators/DoubleEliminationGenerator.js
import { BRACKET_TYPES, MATCH_STATUS } from '../BracketTypes';
import { BracketGenerator } from './BracketGenerator';

export function generateDoubleEliminationBracket(teams, options = {}) {
  const { simulateResults = false } = options;
  
  const winnersBracket = [];
  const losersBracket = [];
  
  // Generate winners bracket
  let currentWinners = [...teams];
  let currentLosers = [];
  let roundNumber = 1;
  const totalRounds = Math.ceil(Math.log2(teams.length));
  
  // Winners bracket generation
  while (currentWinners.length > 1) {
    const matches = [];
    const nextWinners = [];
    const eliminatedToLosers = [];
    
    for (let i = 0; i < currentWinners.length; i += 2) {
      const team1 = currentWinners[i];
      const team2 = currentWinners[i + 1];
      
      let winner, loser, score1, score2;
      let status = simulateResults ? MATCH_STATUS.COMPLETED : MATCH_STATUS.UPCOMING;
      
      if (simulateResults || roundNumber > 1) {
        const result = BracketGenerator.simulateMatchResult(team1, team2);
        winner = result.winner;
        loser = result.loser;
        score1 = result.score1;
        score2 = result.score2;
      } else {
        // Simulate for bracket structure
        const result = BracketGenerator.simulateMatchResult(team1, team2);
        winner = result.winner;
        loser = result.loser;
        score1 = 0;
        score2 = 0;
      }
      
      const match = {
        id: BracketGenerator.generateMatchId(roundNumber, Math.floor(i / 2) + 1, 'winners'),
        roundNumber,
        team1,
        team2,
        winner,
        loser,
        score1,
        score2,
        status,
        bracket: 'winners',
        date: new Date(Date.now() + (roundNumber * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        time: `${10 + roundNumber}:00`,
        venue: `Court ${Math.floor(i / 2) + 1}`,
        referee: `Referee ${Math.floor(i / 2) + 1}`,
        metadata: {
          roundName: `Winners ${BracketGenerator.getRoundName(roundNumber, totalRounds)}`,
          isElimination: false,
          importance: totalRounds - roundNumber + 1
        }
      };
      
      matches.push(match);
      nextWinners.push(winner);
      eliminatedToLosers.push(loser);
    }
    
    winnersBracket.push({
      roundNumber,
      name: `Winners ${BracketGenerator.getRoundName(roundNumber, totalRounds)}`,
      matches,
      bracket: 'winners',
      date: new Date(Date.now() + (roundNumber * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      isCompleted: matches.every(m => m.status === MATCH_STATUS.COMPLETED)
    });
    
    currentWinners = nextWinners;
    currentLosers = [...currentLosers, ...eliminatedToLosers];
    roundNumber++;
  }
  
  // Generate losers bracket (simplified version)
  let losersRoundNumber = 1;
  while (currentLosers.length > 1) {
    const matches = [];
    const nextLosers = [];
    
    for (let i = 0; i < currentLosers.length; i += 2) {
      const team1 = currentLosers[i];
      const team2 = currentLosers[i + 1];
      
      let winner, loser, score1, score2;
      let status = simulateResults ? MATCH_STATUS.COMPLETED : MATCH_STATUS.UPCOMING;
      
      if (simulateResults) {
        const result = BracketGenerator.simulateMatchResult(team1, team2);
        winner = result.winner;
        loser = result.loser;
        score1 = result.score1;
        score2 = result.score2;
      } else {
        // Simulate for bracket structure
        const result = BracketGenerator.simulateMatchResult(team1, team2);
        winner = result.winner;
        loser = result.loser;
        score1 = 0;
        score2 = 0;
      }
      
      const match = {
        id: BracketGenerator.generateMatchId(losersRoundNumber, Math.floor(i / 2) + 1, 'losers'),
        roundNumber: losersRoundNumber,
        team1,
        team2,
        winner,
        loser,
        score1,
        score2,
        status,
        bracket: 'losers',
        date: new Date(Date.now() + ((losersRoundNumber + roundNumber) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        time: `${10 + losersRoundNumber}:00`,
        venue: `Court ${Math.floor(i / 2) + 1}`,
        referee: `Referee ${Math.floor(i / 2) + 1}`,
        metadata: {
          roundName: `Losers Round ${losersRoundNumber}`,
          isElimination: true,
          importance: 1
        }
      };
      
      matches.push(match);
      nextLosers.push(winner);
    }
    
    losersBracket.push({
      roundNumber: losersRoundNumber,
      name: `Losers Round ${losersRoundNumber}`,
      matches,
      bracket: 'losers',
      date: new Date(Date.now() + ((losersRoundNumber + roundNumber) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      isCompleted: matches.every(m => m.status === MATCH_STATUS.COMPLETED)
    });
    
    currentLosers = nextLosers;
    losersRoundNumber++;
  }
  
  // Grand Final
  const grandFinalMatch = {
    id: BracketGenerator.generateMatchId(1, 1, 'grand-final'),
    roundNumber: 1,
    team1: currentWinners[0],
    team2: currentLosers[0],
    winner: simulateResults ? (Math.random() > 0.5 ? currentWinners[0] : currentLosers[0]) : null,
    loser: null,
    score1: simulateResults ? Math.floor(Math.random() * 3) + 1 : 0,
    score2: simulateResults ? Math.floor(Math.random() * 3) + 1 : 0,
    status: simulateResults ? MATCH_STATUS.COMPLETED : MATCH_STATUS.UPCOMING,
    bracket: 'grand-final',
    date: new Date(Date.now() + ((losersRoundNumber + roundNumber) * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    time: '15:00',
    venue: 'Main Court',
    referee: 'Head Referee',
    metadata: {
      roundName: 'Grand Final',
      isElimination: true,
      importance: 10
    }
  };
  
  if (simulateResults) {
    grandFinalMatch.loser = grandFinalMatch.winner === currentWinners[0] ? currentLosers[0] : currentWinners[0];
  }
  
  const grandFinal = {
    roundNumber: 1,
    name: 'Grand Final',
    matches: [grandFinalMatch],
    bracket: 'grand-final',
    date: grandFinalMatch.date,
    isCompleted: grandFinalMatch.status === MATCH_STATUS.COMPLETED
  };
  
  return {
    type: BRACKET_TYPES.DOUBLE_ELIMINATION,
    teams,
    winnersBracket,
    losersBracket,
    grandFinal,
    champion: grandFinalMatch.winner,
    runnerUp: grandFinalMatch.loser,
    metadata: {
      totalMatches: winnersBracket.reduce((sum, round) => sum + round.matches.length, 0) + 
                    losersBracket.reduce((sum, round) => sum + round.matches.length, 0) + 1,
      totalRounds: winnersBracket.length + losersBracket.length + 1,
      estimatedDuration: `${winnersBracket.length + losersBracket.length + 1} days`,
      minVenues: 3,
      eliminationType: 'double',
      formatDescription: 'Double elimination tournament where teams are eliminated after two losses'
    }
  };
}
