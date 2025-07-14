// src/components/tournament/bracket/generators/RoundRobinGenerator.js
import { BRACKET_TYPES, MATCH_STATUS } from '../BracketTypes';
import { BracketGenerator } from './BracketGenerator';

export function generateRoundRobinBracket(teams, options = {}) {
  const { simulateResults = false } = options;
  
  const matches = [];
  let matchId = 1;
  const totalRounds = teams.length - 1;
  
  // Generate all possible matches (each team plays every other team once)
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const team1 = teams[i];
      const team2 = teams[j];
      
      let winner, loser, score1, score2;
      let status = MATCH_STATUS.UPCOMING;
      
      if (simulateResults) {
        // Simulate some matches as completed
        const shouldSimulate = Math.random() > 0.3;
        if (shouldSimulate) {
          const result = BracketGenerator.simulateMatchResult(team1, team2);
          winner = result.winner;
          loser = result.loser;
          score1 = result.score1;
          score2 = result.score2;
          status = MATCH_STATUS.COMPLETED;
        } else {
          score1 = 0;
          score2 = 0;
        }
      } else {
        score1 = 0;
        score2 = 0;
      }
      
      const match = {
        id: BracketGenerator.generateMatchId(Math.ceil(matchId / Math.floor(teams.length / 2)), matchId, 'rr'),
        roundNumber: Math.ceil(matchId / Math.floor(teams.length / 2)),
        team1,
        team2,
        winner,
        loser,
        score1,
        score2,
        status,
        date: new Date(Date.now() + (matchId * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        time: `${10 + (matchId % 8)}:00`,
        venue: `Court ${((matchId - 1) % 4) + 1}`,
        referee: `Referee ${((matchId - 1) % 3) + 1}`,
        metadata: {
          roundName: `Round ${Math.ceil(matchId / Math.floor(teams.length / 2))}`,
          isElimination: false,
          importance: 1,
          matchNumber: matchId
        }
      };
      
      matches.push(match);
      matchId++;
    }
  }
  
  // Calculate standings
  const standings = teams.map(team => {
    const teamMatches = matches.filter(m => 
      (m.team1.id === team.id || m.team2.id === team.id) && m.status === MATCH_STATUS.COMPLETED
    );
    
    const wins = teamMatches.filter(m => m.winner?.id === team.id).length;
    const losses = teamMatches.filter(m => 
      (m.team1.id === team.id || m.team2.id === team.id) && m.winner?.id !== team.id
    ).length;
    const draws = teamMatches.filter(m => !m.winner).length;
    const played = teamMatches.length;
    
    const goalsFor = teamMatches.reduce((sum, m) => {
      if (m.team1.id === team.id) return sum + m.score1;
      if (m.team2.id === team.id) return sum + m.score2;
      return sum;
    }, 0);
    
    const goalsAgainst = teamMatches.reduce((sum, m) => {
      if (m.team1.id === team.id) return sum + m.score2;
      if (m.team2.id === team.id) return sum + m.score1;
      return sum;
    }, 0);
    
    return {
      ...team,
      played,
      wins,
      draws,
      losses,
      points: wins * 3 + draws * 1,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      form: teamMatches.slice(-5).map(m => {
        if (m.winner?.id === team.id) return 'W';
        if (m.winner && m.winner.id !== team.id) return 'L';
        return 'D';
      }).join(''),
      stats: {
        ...team.stats,
        wins,
        draws,
        losses,
        points: wins * 3 + draws * 1,
        goalsFor,
        goalsAgainst,
        played
      }
    };
  });
  
  // Sort standings by points, then goal difference, then goals for
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
  
  // Group matches by rounds
  const rounds = [];
  const matchesPerRound = Math.floor(teams.length / 2);
  
  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches = matches.filter(m => m.roundNumber === round);
    
    rounds.push({
      roundNumber: round,
      name: `Round ${round}`,
      matches: roundMatches,
      date: new Date(Date.now() + (round * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      isCompleted: roundMatches.every(m => m.status === MATCH_STATUS.COMPLETED)
    });
  }
  
  return {
    type: BRACKET_TYPES.ROUND_ROBIN,
    teams,
    matches,
    rounds,
    standings,
    champion: standings[0],
    runnerUp: standings[1],
    metadata: {
      totalMatches: matches.length,
      totalRounds: totalRounds,
      matchesPerTeam: teams.length - 1,
      estimatedDuration: `${Math.ceil(matches.length / 4)} days`,
      minVenues: 4,
      completedMatches: matches.filter(m => m.status === MATCH_STATUS.COMPLETED).length,
      formatDescription: 'Round robin tournament where every team plays every other team once'
    }
  };
}
