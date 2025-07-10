// src/components/tournament/bracket/generators/KnockoutGenerator.js
import { BRACKET_TYPES, MATCH_STATUS } from '../BracketTypes';
import { BracketGenerator } from './BracketGenerator';

export function generateKnockoutBracket(teams, options = {}) {
  const { simulateResults = false } = options;
  
  // Ensure power of 2 teams
  const teamCount = teams.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
  const byes = nextPowerOf2 - teamCount;
  
  // Add bye teams if needed
  const bracketTeams = [...teams];
  for (let i = 0; i < byes; i++) {
    bracketTeams.push({
      id: `bye-${i + 1}`,
      name: 'BYE',
      isBye: true,
      school: 'Bye',
      seed: teamCount + i + 1
    });
  }
  
  const rounds = [];
  let currentRound = [...bracketTeams];
  let roundNumber = 1;
  const totalRounds = Math.log2(nextPowerOf2);
  
  while (currentRound.length > 1) {
    const matches = [];
    const nextRound = [];
    
    for (let i = 0; i < currentRound.length; i += 2) {
      const team1 = currentRound[i];
      const team2 = currentRound[i + 1];
      
      let winner = null;
      let loser = null;
      let score1 = 0;
      let score2 = 0;
      let status = MATCH_STATUS.UPCOMING;
      
      // Handle bye matches
      if (team1.isBye) {
        winner = team2;
        loser = team1;
        status = MATCH_STATUS.COMPLETED;
      } else if (team2.isBye) {
        winner = team1;
        loser = team2;
        status = MATCH_STATUS.COMPLETED;
      } else if (simulateResults && roundNumber > 1) {
        // Simulate match for demonstration
        const result = BracketGenerator.simulateMatchResult(team1, team2);
        winner = result.winner;
        loser = result.loser;
        score1 = result.score1;
        score2 = result.score2;
        status = MATCH_STATUS.COMPLETED;
      }
      
      const match = {
        id: BracketGenerator.generateMatchId(roundNumber, Math.floor(i / 2) + 1),
        roundNumber,
        team1,
        team2,
        winner,
        loser,
        score1,
        score2,
        status,
        date: new Date(Date.now() + (roundNumber * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        time: `${10 + roundNumber}:00`,
        venue: `Court ${Math.floor(i / 2) + 1}`,
        referee: `Referee ${Math.floor(i / 2) + 1}`,
        duration: null,
        notes: '',
        metadata: {
          roundName: BracketGenerator.getRoundName(roundNumber, totalRounds),
          isElimination: true,
          importance: totalRounds - roundNumber + 1
        }
      };
      
      matches.push(match);
      
      if (winner) {
        nextRound.push(winner);
      } else {
        // For first round, advance both teams for now
        nextRound.push(team1);
      }
    }
    
    rounds.push({
      roundNumber,
      name: BracketGenerator.getRoundName(roundNumber, totalRounds),
      matches,
      date: new Date(Date.now() + (roundNumber * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      isCompleted: matches.every(m => m.status === MATCH_STATUS.COMPLETED)
    });
    
    if (roundNumber === 1 && !simulateResults) {
      // For first round, create next round with winners
      const simulatedNextRound = [];
      for (const match of matches) {
        if (match.winner) {
          simulatedNextRound.push(match.winner);
        } else {
          // Simulate winner for bracket structure
          const result = BracketGenerator.simulateMatchResult(match.team1, match.team2);
          simulatedNextRound.push(result.winner);
        }
      }
      currentRound = simulatedNextRound;
    } else {
      currentRound = nextRound;
    }
    
    roundNumber++;
  }
  
  return {
    type: BRACKET_TYPES.KNOCKOUT,
    teams: teams,
    rounds,
    champion: currentRound[0] || null,
    metadata: {
      totalMatches: rounds.reduce((sum, round) => sum + round.matches.length, 0),
      totalRounds: rounds.length,
      estimatedDuration: `${rounds.length} days`,
      minVenues: Math.max(...rounds.map(r => r.matches.length)),
      bracketSize: nextPowerOf2,
      byesUsed: byes,
      eliminationType: 'single',
      formatDescription: 'Single elimination tournament where teams are eliminated after one loss'
    }
  };
}
