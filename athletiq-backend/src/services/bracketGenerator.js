// src/services/bracketGenerator.js

const { v4: uuidv4 } = require("uuid");
const pool = require("../config/db");
const { generateShortCode } = require("../utils/codeGenerator");

// Utility to shuffle array (for random matchups)
function shuffle(array) {
  let currentIndex = array.length;
  let randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Generate knockout-style matchups
async function generateKnockoutMatches(tournamentId, categoryId, totalTeams) {
  const shuffledTeams = shuffle(Array.from({ length: totalTeams }, (_, i) => i + 1));
  const matchups = [];
  let round = 1;
  let currentTeams = shuffledTeams;

  while (currentTeams.length > 1) {
    const roundMatches = [];
    for (let i = 0; i < currentTeams.length; i += 2) {
      const teamA = currentTeams[i];
      const teamB = currentTeams[i + 1] || null;
      const matchCode = await generateShortCode("M");

      const res = await pool.query(
        `INSERT INTO matches (tournament_id, category_id, round, team_a, team_b, code)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tournamentId, categoryId, round, teamA, teamB, matchCode]
      );
      roundMatches.push(res.rows[0]);
    }
    matchups.push(...roundMatches);
    currentTeams = roundMatches.map(() => uuidv4()); // mock for next round
    round++;
  }
  return matchups;
}

// Generate round-robin matches (each vs each)
async function generateRoundRobinMatches(tournamentId, categoryId, totalTeams) {
  const teams = Array.from({ length: totalTeams }, (_, i) => i + 1);
  const matchups = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const matchCode = await generateShortCode("M");
      const res = await pool.query(
        `INSERT INTO matches (tournament_id, category_id, round, team_a, team_b, code)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [tournamentId, categoryId, 1, teams[i], teams[j], matchCode]
      );
      matchups.push(res.rows[0]);
    }
  }
  return matchups;
}

// Placeholder for league format (group + knockout)
async function generateLeagueMatches(tournamentId, categoryId, totalTeams) {
  // For simplicity: break into 2 groups, round-robin each, top 2 advance to knockout
  const shuffled = shuffle(Array.from({ length: totalTeams }, (_, i) => i + 1));
  const groupSize = Math.ceil(totalTeams / 2);
  const groupA = shuffled.slice(0, groupSize);
  const groupB = shuffled.slice(groupSize);

  const generateGroupMatches = async (group, roundOffset = 0) => {
    const matches = [];
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const matchCode = await generateShortCode("M");
        const res = await pool.query(
          `INSERT INTO matches (tournament_id, category_id, round, team_a, team_b, code)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [tournamentId, categoryId, 1 + roundOffset, group[i], group[j], matchCode]
        );
        matches.push(res.rows[0]);
      }
    }
    return matches;
  };

  const groupAMatches = await generateGroupMatches(groupA);
  const groupBMatches = await generateGroupMatches(groupB);

  return [...groupAMatches, ...groupBMatches];
}

module.exports = {
  generateKnockoutMatches,
  generateRoundRobinMatches,
  generateLeagueMatches,
};
