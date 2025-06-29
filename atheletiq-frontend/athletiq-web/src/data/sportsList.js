// src/data/sportsList.js

// 🧠 ATHLETIQ - Sports Data
// This file serves as the single source of truth for the list of sports
// available throughout the application, including their type, formats,
// and specific rules like team sizes or heat requirements.

const sportsList = [
  // --- Section I: Most Popular Global Sports (with Nepal relevance) ---
  {
    id: 1,
    name: "Football (Soccer)",
    type: "team",
    icon: "Football", // Used for emoji mapping
    formats: ["5-a-side", "7-a-side", "11-a-side", "Indoor"],
    team_members_min: 7, // Minimum players for a full roster including subs
    team_members_max: 23, // Max squad size for larger tournaments
    players_per_side: { "5-a-side": 5, "7-a-side": 7, "11-a-side": 11, "Indoor": 5 }, // Players actively playing on field/court per side for given format
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin", "Group Stage + Knockout"],
  },
  {
    id: 2,
    name: "Cricket",
    type: "team",
    icon: "Cricket",
    formats: ["T20", "ODI (50 overs)", "Test Match"],
    team_members_min: 11,
    team_members_max: 15, // Standard squad size
    players_per_side: { "T20": 11, "ODI (50 overs)": 11, "Test Match": 11 },
    has_heats: false,
    tournament_types: ["League / Round-Robin", "Knockout"],
  },
  {
    id: 3,
    name: "Basketball",
    type: "team",
    icon: "Basketball",
    formats: ["3x3", "5x5"],
    team_members_min: 4,
    team_members_max: 12,
    players_per_side: { "3x3": 3, "5x5": 5 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin"],
  },
  {
    id: 4,
    name: "Tennis",
    type: "individual",
    icon: "Tennis",
    formats: ["Singles", "Doubles", "Mixed Doubles"],
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Singles": 1, "Doubles": 2, "Mixed Doubles": 2 },
    has_heats: false,
    tournament_types: ["Knockout"],
  },
  {
    id: 5,
    name: "Volleyball",
    type: "team",
    icon: "Volleyball",
    formats: ["6x6", "Beach Volleyball (2x2)"],
    team_members_min: 6,
    team_members_max: 14,
    players_per_side: { "6x6": 6, "Beach Volleyball (2x2)": 2 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin", "Group Stage + Knockout"],
  },
  {
    id: 6,
    name: "Table Tennis",
    type: "individual",
    icon: "TableTennis",
    formats: ["Singles", "Doubles"],
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Singles": 1, "Doubles": 2 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin"],
  },
  {
    id: 7,
    name: "Badminton",
    type: "individual",
    icon: "Badminton",
    formats: ["Singles", "Doubles", "Mixed Doubles"],
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Singles": 1, "Doubles": 2, "Mixed Doubles": 2 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin"],
  },
  {
    id: 8,
    name: "Rugby Union",
    type: "team",
    icon: "Rugby",
    formats: ["XV-a-side", "7s"],
    team_members_min: 15,
    team_members_max: 23,
    players_per_side: { "XV-a-side": 15, "7s": 7 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin", "Group Stage + Knockout"],
  },
  {
    id: 9,
    name: "Boxing",
    type: "individual",
    icon: "BoxingGlove",
    formats: ["Standard Bout"],
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Standard Bout": 1 },
    has_heats: false,
    tournament_types: ["Knockout"],
  },
  {
    id: 10,
    name: "Field Hockey",
    type: "team",
    icon: "FieldHockey",
    formats: ["11-a-side", "5-a-side (Indoor/Small)" ],
    team_members_min: 11,
    team_members_max: 18,
    players_per_side: { "11-a-side": 11, "5-a-side (Indoor/Small)": 5 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin", "Group Stage + Knockout"],
  },
  {
    id: 11,
    name: "Baseball",
    type: "team",
    icon: "Baseball",
    formats: ["Standard (9 innings)", "Little League (6 innings)"],
    team_members_min: 9,
    team_members_max: 25,
    players_per_side: { "Standard (9 innings)": 9, "Little League (6 innings)": 9 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin"],
  },
  {
    id: 12,
    name: "Golf",
    type: "individual",
    icon: "Golf",
    formats: ["Stroke Play", "Match Play", "Scramble (Team)"], // Scramble is team but 1 player per hole
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Stroke Play": 1, "Match Play": 1, "Scramble (Team)": 1 }, // Players playing per round
    has_heats: false,
    tournament_types: ["Stroke Play Tournament", "Match Play Tournament", "Team Tournament"],
  },

  // --- Section II: Detailed Athletics Events (Track & Field) ---
  {
    id: 13,
    name: "Athletics - 100m Sprint",
    type: "individual",
    icon: "Running",
    formats: ["Individual Race"],
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Individual Race": 1 },
    has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 14,
    name: "Athletics - 200m Sprint",
    type: "individual",
    icon: "Running",
    formats: ["Individual Race"],
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Individual Race": 1 },
    has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 15,
    name: "Athletics - 400m Sprint",
    type: "individual",
    icon: "Running",
    formats: ["Individual Race"],
    team_members_min: null,
    team_members_max: null,
    players_per_side: { "Individual Race": 1 },
    has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 16,
    name: "Athletics - 800m Run",
    type: "individual",
    icon: "Running",
    formats: ["Individual Race"],
    team_members_min: null, players_per_side: { "Individual Race": 1 }, has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 17,
    name: "Athletics - 1500m Run",
    type: "individual",
    icon: "Running",
    formats: ["Individual Race"],
    team_members_min: null, players_per_side: { "Individual Race": 1 }, has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 18,
    name: "Athletics - 5000m Run",
    type: "individual",
    icon: "Running",
    formats: ["Individual Race"],
    team_members_min: null, players_per_side: { "Individual Race": 1 }, has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 19,
    name: "Athletics - 10000m Run",
    type: "individual",
    icon: "Running",
    formats: ["Individual Race"],
    team_members_min: null, players_per_side: { "Individual Race": 1 }, has_heats: false, // Often direct final
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 20,
    name: "Athletics - Marathon",
    type: "individual",
    icon: "Running",
    formats: ["Full Marathon", "Half Marathon", "10K Race"],
    team_members_min: null, players_per_side: { "Full Marathon": 1, "Half Marathon": 1, "10K Race": 1 }, has_heats: false,
    tournament_types: ["Standard Race"],
  },
  {
    id: 21,
    name: "Athletics - 110m Hurdles (Men)",
    type: "individual",
    icon: "Hurdles",
    formats: ["Individual Race"],
    team_members_min: null, players_per_side: { "Individual Race": 1 }, has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 22,
    name: "Athletics - 100m Hurdles (Women)",
    type: "individual",
    icon: "Hurdles",
    formats: ["Individual Race"],
    team_members_min: null, players_per_side: { "Individual Race": 1 }, has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 23,
    name: "Athletics - 4x100m Relay",
    type: "team",
    icon: "Relay",
    formats: ["Relay Race"],
    team_members_min: 4, team_members_max: 6, // 4 active, plus alternates
    players_per_side: { "Relay Race": 4 },
    has_heats: true,
    tournament_types: ["Heats & Finals"],
  },
  {
    id: 24,
    name: "Athletics - Long Jump",
    type: "individual",
    icon: "LongJump",
    formats: ["Standard Competition"],
    team_members_min: null, players_per_side: { "Standard Competition": 1 }, has_heats: false,
    tournament_types: ["Standard Competition"],
  },
  {
    id: 25,
    name: "Athletics - High Jump",
    type: "individual",
    icon: "HighJump",
    formats: ["Standard Competition"],
    team_members_min: null, players_per_side: { "Standard Competition": 1 }, has_heats: false,
    tournament_types: ["Standard Competition"],
  },
  {
    id: 26,
    name: "Athletics - Shot Put",
    type: "individual",
    icon: "ShotPut",
    formats: ["Standard Competition"],
    team_members_min: null, players_per_side: { "Standard Competition": 1 }, has_heats: false,
    tournament_types: ["Standard Competition"],
  },
  {
    id: 27,
    name: "Athletics - Discus Throw",
    type: "individual",
    icon: "Discus",
    formats: ["Standard Competition"],
    team_members_min: null, players_per_side: { "Standard Competition": 1 }, has_heats: false,
    tournament_types: ["Standard Competition"],
  },

  // --- Section III: Other Major/Well-Known Sports (Continued) ---
  {
    id: 28,
    name: "Swimming - Individual",
    type: "individual",
    icon: "Swimming",
    formats: ["Individual Race"],
    team_members_min: null, players_per_side: { "Individual Race": 1 }, has_heats: true,
    tournament_types: ["Timed Trial", "Heats & Finals"],
  },
  {
    id: 29,
    name: "Swimming - Relay",
    type: "team",
    icon: "SwimmingRelay",
    formats: ["4x100m Freestyle", "4x50m Medley"],
    team_members_min: 4, team_members_max: 6,
    players_per_side: { "4x100m Freestyle": 4, "4x50m Medley": 4 },
    has_heats: true,
    tournament_types: ["Heats & Finals"],
  },
  {
    id: 30,
    name: "Cycling - Road Race",
    type: "individual",
    icon: "Cycling",
    formats: ["Mass Start", "Individual Time Trial"],
    team_members_min: null, players_per_side: { "Mass Start": 1, "Individual Time Trial": 1 }, has_heats: false,
    tournament_types: ["Timed Competition", "Points Race"],
  },
  {
    id: 31,
    name: "Gymnastics - Artistic",
    type: "individual",
    icon: "Gymnastics",
    formats: ["All-Around", "Individual Apparatus"],
    team_members_min: null, players_per_side: { "All-Around": 1, "Individual Apparatus": 1 }, has_heats: false,
    tournament_types: ["Standard Competition", "Qualifiers & Finals"],
  },
  {
    id: 32,
    name: "Judo",
    type: "individual",
    icon: "Judo",
    formats: ["Individual Match"],
    team_members_min: null, players_per_side: { "Individual Match": 1 }, has_heats: false,
    tournament_types: ["Knockout", "Pools & Direct Elimination"],
  },
  {
    id: 33,
    name: "Karate",
    type: "individual",
    icon: "Karate",
    formats: ["Kumite (Individual)", "Kata (Individual)"],
    team_members_min: null, players_per_side: { "Kumite (Individual)": 1, "Kata (Individual)": 1 }, has_heats: false,
    tournament_types: ["Knockout", "Standard Competition"],
  },
  {
    id: 34,
    name: "Taekwondo",
    type: "individual",
    icon: "Taekwondo",
    formats: ["Kyorugi (Sparring)", "Poomsae (Forms)"],
    team_members_min: null, players_per_side: { "Kyorugi (Sparring)": 1, "Poomsae (Forms)": 1 }, has_heats: false,
    tournament_types: ["Knockout", "Standard Competition"],
  },
  {
    id: 35,
    name: "Weightlifting",
    type: "individual",
    icon: "Weightlifting",
    formats: ["Snatch & Clean & Jerk (Total)"],
    team_members_min: null, players_per_side: { "Snatch & Clean & Jerk (Total)": 1 }, has_heats: false,
    tournament_types: ["Standard Competition"],
  },
  {
    id: 36,
    name: "Handball",
    type: "team",
    icon: "Handball",
    formats: ["7-a-side"],
    team_members_min: 7, team_members_max: 16,
    players_per_side: { "7-a-side": 7 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin", "Group Stage + Knockout"],
  },
  {
    id: 37,
    name: "Squash",
    type: "individual",
    icon: "Squash",
    formats: ["Singles", "Doubles"],
    team_members_min: null, players_per_side: { "Singles": 1, "Doubles": 2 }, has_heats: false,
    tournament_types: ["Knockout"],
  },
  {
    id: 38,
    name: "Fencing",
    type: "individual",
    icon: "Fencing",
    formats: ["Individual Bout (Foil)", "Individual Bout (Epee)", "Individual Bout (Sabre)"],
    team_members_min: null, players_per_side: { "Individual Bout (Foil)": 1, "Individual Bout (Epee)": 1, "Individual Bout (Sabre)": 1 }, has_heats: false,
    tournament_types: ["Knockout", "Pools & Direct Elimination"],
  },
  // Add other prominent sports for Nepal / global relevance
  {
    id: 39,
    name: "Kabaddi", // Popular in South Asia
    type: "team",
    icon: "Kabaddi",
    formats: ["Standard"],
    team_members_min: 7, team_members_max: 12, // 7 active, 5 subs
    players_per_side: { "Standard": 7 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin", "Group Stage + Knockout"],
  },
  {
    id: 40,
    name: "Wushu (Kung Fu)", // Popular martial art
    type: "individual",
    icon: "Wushu",
    formats: ["Sanda (Sparring)", "Taolu (Forms)"],
    team_members_min: null, players_per_side: { "Sanda (Sparring)": 1, "Taolu (Forms)": 1 }, has_heats: false,
    tournament_types: ["Knockout", "Standard Competition"],
  },
  {
    id: 41,
    name: "Kho Kho", // Traditional South Asian tag game
    type: "team",
    icon: "KhoKho",
    formats: ["Standard"],
    team_members_min: 9, team_members_max: 12,
    players_per_side: { "Standard": 9 },
    has_heats: false,
    tournament_types: ["Knockout", "League / Round-Robin"],
  },
  // --- Section IV: Niche/Growing Sports (Selected for Variety) ---
  {
    id: 42,
    name: "Esports - Valorant",
    type: "team",
    icon: "EsportsController", // Specific controller icon for esports
    formats: ["5 vs 5"],
    team_members_min: 5, team_members_max: 7,
    players_per_side: { "5 vs 5": 5 },
    has_heats: false,
    tournament_types: ["Knockout", "Group Stage + Knockout"],
  },
  {
    id: 43,
    name: "Sport Climbing",
    type: "individual",
    icon: "Climbing",
    formats: ["Lead Climbing", "Bouldering", "Speed Climbing"],
    team_members_min: null, players_per_side: { "Lead Climbing": 1, "Bouldering": 1, "Speed Climbing": 1 }, has_heats: false,
    tournament_types: ["Standard Competition", "Qualifiers & Finals"],
  },
  {
    id: 44,
    name: "Chess", // Common in schools/universities
    type: "individual",
    icon: "Chess",
    formats: ["Rapid", "Blitz", "Classical"],
    team_members_min: null, players_per_side: { "Rapid": 1, "Blitz": 1, "Classical": 1 }, has_heats: false,
    tournament_types: ["Swiss System", "Knockout", "Round-Robin"],
  },
  {
    id: 45,
    name: "Carrom", // Popular board game in homes/schools
    type: "individual", // Can be doubles too
    icon: "Carrom",
    formats: ["Singles", "Doubles"],
    team_members_min: null, players_per_side: { "Singles": 1, "Doubles": 2 }, has_heats: false,
    tournament_types: ["Knockout", "Round-Robin"],
  },
  {
    id: 46,
    name: "Ludo", // Popular board game in homes/schools
    type: "individual", // Can be teams/individual player scoring
    icon: "Ludo",
    formats: ["4-Player Free-for-all"],
    team_members_min: null, players_per_side: { "4-Player Free-for-all": 1 }, has_heats: false,
    tournament_types: ["Knockout", "Round-Robin"],
  },
];

// Expanded ICONS mapping for all new and existing sports
const ICONS = {
  Football: '⚽',
  Cricket: '�',
  Basketball: '🏀',
  Tennis: '🎾',
  Volleyball: '🏐',
  TableTennis: '🏓',
  Badminton: '🏸',
  Rugby: '🏉',
  BoxingGlove: '🥊',
  FieldHockey: '🏑',
  Baseball: '⚾',
  Golf: '⛳',
  Running: '🏃',       // General running icon
  Jumping: '🤸',       // General jumping icon
  Hurdles: '🚧',      // Hurdles specific
  Relay: '🏃‍♀️🏃‍♂️',  // Relay specific
  LongJump: '🤸‍♂️',    // More specific for Long Jump
  HighJump: '⬆️',    // More specific for High Jump
  ShotPut: '🔴',     // Red circle for Shot Put
  Discus: '📀',      // Disc icon for Discus
  Swimming: '🏊',
  SwimmingRelay: '🏊‍♂️🏊‍♀️', // Specific for swim relay
  Cycling: '🚴',
  Gymnastics: '🤸‍♀️',
  Judo: '🥋',
  Karate: '🥋',
  Taekwondo: '🥋',
  Weightlifting: '🏋️',
  Handball: '🤾',
  Squash: '🎾',
  Fencing: '🤺',
  Kabaddi: '🤼',     // Wrestlers/grapplers
  Wushu: '🥋',      // Reuse martial arts gi
  KhoKho: '🏃‍♀️💨',   // Running with dashed lines
  EsportsController: '🎮', // Specific controller icon for esports
  Climbing: '🧗',
  Chess: '♟️',
  Carrom: '⚪',     // White circle for carrom piece
  Ludo: '🎲',       // Dice for Ludo
  Default: '🏆',      // Fallback icon
};

// Map icons into the sportsList for easier access in UI (ensure this is at the end)
sportsList.forEach(sport => {
    sport.icon = ICONS[sport.icon] || ICONS.Default;
});

export default sportsList;
