// src/components/tournament/bracket/BracketTypes.js
export const BRACKET_TYPES = {
  KNOCKOUT: 'knockout',
  DOUBLE_ELIMINATION: 'double_elimination',
  ROUND_ROBIN: 'round_robin',
  GROUP_KNOCKOUT: 'group_knockout',
  CUSTOM_HEATS: 'custom_heats'
};

export const BRACKET_TYPE_CONFIG = [
  { 
    value: BRACKET_TYPES.KNOCKOUT, 
    label: 'Single Elimination (Knockout)', 
    description: 'Teams eliminated after one loss',
    icon: '🏆',
    minTeams: 4,
    maxTeams: 64,
    supportsPowerOfTwo: true
  },
  { 
    value: BRACKET_TYPES.DOUBLE_ELIMINATION, 
    label: 'Double Elimination', 
    description: 'Teams eliminated after two losses',
    icon: '🔥',
    minTeams: 4,
    maxTeams: 32,
    supportsPowerOfTwo: true
  },
  { 
    value: BRACKET_TYPES.ROUND_ROBIN, 
    label: 'Round Robin', 
    description: 'Every team plays every other team',
    icon: '🔄',
    minTeams: 3,
    maxTeams: 16,
    supportsPowerOfTwo: false
  },
  { 
    value: BRACKET_TYPES.GROUP_KNOCKOUT, 
    label: 'Group + Knockout', 
    description: 'Group stage followed by knockout',
    icon: '🎯',
    minTeams: 8,
    maxTeams: 32,
    supportsPowerOfTwo: false
  },
  { 
    value: BRACKET_TYPES.CUSTOM_HEATS, 
    label: 'Custom/Heats', 
    description: 'Custom format with heats',
    icon: '⚡',
    minTeams: 4,
    maxTeams: 100,
    supportsPowerOfTwo: false
  }
];

export const TEAM_ASSIGNMENT_MODES = {
  RANDOM: 'random',
  SEEDED: 'seeded',
  MANUAL: 'manual'
};

export const TEAM_ASSIGNMENT_CONFIG = [
  {
    value: TEAM_ASSIGNMENT_MODES.RANDOM,
    label: 'Random Draw',
    description: 'Teams randomly assigned to bracket positions',
    icon: '🎲'
  },
  {
    value: TEAM_ASSIGNMENT_MODES.SEEDED,
    label: 'Seeded',
    description: 'Teams assigned based on seeding/ranking',
    icon: '📊'
  },
  {
    value: TEAM_ASSIGNMENT_MODES.MANUAL,
    label: 'Manual',
    description: 'Manually assign teams to positions',
    icon: '✋'
  }
];

export const MATCH_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled'
};

export const BRACKET_STATUS = {
  SETUP: 'setup',
  LOCKED: 'locked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};
