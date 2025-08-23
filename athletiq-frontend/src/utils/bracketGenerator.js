// src/utils/bracketGenerator.js

// Generate simple placeholder teams
const generatePlaceholderTeams = (tournamentSize) => {
  const teams = [];
  for (let i = 0; i < tournamentSize; i++) {
    teams.push({
      name: `Team ${i + 1}`,
      seed: i + 1,
      school: `School ${i + 1}`,
      score: 0
    });
  }
  return teams;
};

export const generatePlaceholderBracket = (tournamentSize = 8, bracketType = 'knockout') => {
  const rounds = Math.ceil(Math.log2(tournamentSize));
  const matches = [];
  const roundsData = [];
  const placeholderTeams = generatePlaceholderTeams(tournamentSize);
  
  let matchId = 1;
  let currentRoundSize = tournamentSize;
  let teamIndex = 0;
  
  for (let round = 1; round <= rounds; round++) {
    const roundName = getRoundName(round, rounds);
    const matchesInRound = Math.ceil(currentRoundSize / 2);
    
    roundsData.push({
      id: round,
      name: roundName,
      date: `Round ${round}`,
      matches: matchesInRound
    });
    
    for (let match = 1; match <= matchesInRound; match++) {
      const matchData = {
        id: matchId++,
        round: round,
        roundName: roundName,
        teams: [],
        status: 'upcoming',
        date: `2025-04-${20 + round}`,
        time: `${18 + (match - 1)}:00`,
        venue: `Court ${match}`
      };
      
      // For first round, use placeholder teams
      if (round === 1 && teamIndex < placeholderTeams.length) {
        matchData.teams = [
          { ...placeholderTeams[teamIndex++], score: 0 },
          { ...placeholderTeams[teamIndex++], score: 0 }
        ];
      } else {
        // For later rounds, use TBD teams
        matchData.teams = [
          { name: 'TBD', seed: null, school: 'TBD', score: 0 },
          { name: 'TBD', seed: null, school: 'TBD', score: 0 }
        ];
      }
      
      matches.push(matchData);
    }
    
    currentRoundSize = matchesInRound;
  }
  
  return {
    type: bracketType,
    size: tournamentSize,
    rounds: roundsData,
    matches: matches,
    champion: null
  };
};

export const generateDoubleEliminationBracket = (tournamentSize = 8) => {
  const winnerBracket = generatePlaceholderBracket(tournamentSize, 'winner');
  const loserBracket = generatePlaceholderBracket(tournamentSize - 1, 'loser');
  
  return {
    type: 'double_elimination',
    size: tournamentSize,
    winnerBracket: winnerBracket,
    loserBracket: loserBracket,
    finalMatch: {
      id: 'final',
      round: 'final',
      roundName: 'Grand Final',
      teams: [
        { name: null, score: 0 },
        { name: null, score: 0 }
      ],
      status: 'pending',
      date: null,
      time: null,
      venue: null
    },
    champion: null
  };
};

export const generateRoundRobinBracket = (tournamentSize = 8) => {
  const matches = [];
  let matchId = 1;
  
  // Generate all possible combinations of teams
  for (let i = 1; i <= tournamentSize; i++) {
    for (let j = i + 1; j <= tournamentSize; j++) {
      matches.push({
        id: matchId++,
        round: 1,
        roundName: 'Round Robin',
        teams: [
          { name: null, score: 0 },
          { name: null, score: 0 }
        ],
        status: 'pending',
        date: null,
        time: null,
        venue: null
      });
    }
  }
  
  return {
    type: 'round_robin',
    size: tournamentSize,
    rounds: [{
      id: 1,
      name: 'Round Robin',
      matches: matches.length
    }],
    matches: matches,
    champion: null
  };
};

export const generateGroupStageBracket = (tournamentSize = 16, groupSize = 4) => {
  const numGroups = Math.ceil(tournamentSize / groupSize);
  const groups = [];
  
  for (let g = 1; g <= numGroups; g++) {
    const groupMatches = [];
    let matchId = (g - 1) * 100 + 1;
    
    // Round robin within each group
    for (let i = 1; i <= groupSize; i++) {
      for (let j = i + 1; j <= groupSize; j++) {
        groupMatches.push({
          id: matchId++,
          round: 1,
          roundName: `Group ${String.fromCharCode(64 + g)}`,
          group: g,
          teams: [
            { name: null, score: 0 },
            { name: null, score: 0 }
          ],
          status: 'pending',
          date: null,
          time: null,
          venue: null
        });
      }
    }
    
    groups.push({
      id: g,
      name: `Group ${String.fromCharCode(64 + g)}`,
      matches: groupMatches,
      standings: []
    });
  }
  
  // Knockout phase
  const knockoutBracket = generatePlaceholderBracket(numGroups * 2, 'knockout');
  
  return {
    type: 'group_knockout',
    size: tournamentSize,
    groupSize: groupSize,
    groups: groups,
    knockoutPhase: knockoutBracket,
    champion: null
  };
};

const getRoundName = (round, totalRounds) => {
  if (round === totalRounds) return 'Final';
  if (round === totalRounds - 1) return 'Semi-Final';
  if (round === totalRounds - 2) return 'Quarter-Final';
  if (round === 1) return 'First Round';
  return `Round ${round}`;
};

export const getDefaultBracketSize = (participantCount) => {
  if (participantCount <= 4) return 4;
  if (participantCount <= 8) return 8;
  if (participantCount <= 16) return 16;
  if (participantCount <= 32) return 32;
  return 64;
};

export const generateBracketFromType = (type, size) => {
  switch (type) {
    case 'knockout':
      return generatePlaceholderBracket(size, 'knockout');
    case 'double_elimination':
      return generateDoubleEliminationBracket(size);
    case 'round_robin':
      return generateRoundRobinBracket(size);
    case 'group_knockout':
      return generateGroupStageBracket(size);
    default:
      return generatePlaceholderBracket(size, 'knockout');
  }
};
