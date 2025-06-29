// utils/sportCategoryBuilder.js

/**
 * Returns sport-specific category structure
 * for configuring tournament rules and player constraints.
 */
function getSportCategoryConfig(sportName) {
  const config = {
    football: {
      type: "team",
      teamSize: 11,
      maxBench: 5,
      allowMixed: false,
      scoring: "goals",
      formatOptions: ["knockout", "round-robin", "league"],
    },
    basketball: {
      type: "team",
      teamSize: 5,
      maxBench: 5,
      allowMixed: false,
      scoring: "points",
      formatOptions: ["knockout", "round-robin"],
    },
    running: {
      type: "individual",
      maxParticipantsPerSchool: 2,
      allowMixed: true,
      distanceOptions: ["100m", "200m", "400m", "800m", "1500m"],
      format: "timed",
    },
    long_jump: {
      type: "individual",
      maxParticipantsPerSchool: 2,
      allowMixed: true,
      format: "measured",
    },
    cricket: {
      type: "team",
      teamSize: 11,
      maxBench: 4,
      allowMixed: false,
      scoring: "runs",
      formatOptions: ["league", "knockout"],
    },
  };

  return config[sportName] || null;
}

module.exports = {
  getSportCategoryConfig,
};
