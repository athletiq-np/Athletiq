// src/services/ai/athleteIdGenerator.js - Global Athlete ID Generation Service
require('dotenv').config();
const crypto = require('crypto');
const { pool, query } = require('../../config/db');
const { logger } = require('../../config/db');

class AthleteIdGenerator {
  constructor() {
    this.prefix = 'ATH';
    this.checksumLength = 2;
    this.idLength = 10; // Total length including prefix
  }

  /**
   * Generate a unique athlete ID
   */
  async generateAthleteId(playerData) {
    try {
      // Create a unique identifier based on player data
      const uniqueString = this.createUniqueString(playerData);
      
      // Generate sequential number
      const sequentialNumber = await this.getNextSequentialNumber();
      
      // Create the base ID (without checksum)
      const baseId = `${this.prefix}${sequentialNumber.toString().padStart(5, '0')}`;
      
      // Calculate checksum
      const checksum = this.calculateChecksum(baseId, uniqueString);
      
      // Final athlete ID
      const athleteId = `${baseId}${checksum}`;
      
      // Verify uniqueness
      const isUnique = await this.verifyUniqueness(athleteId);
      if (!isUnique) {
        logger.warn('Generated athlete ID collision, retrying', { athleteId });
        return this.generateAthleteId(playerData); // Retry
      }
      
      logger.info('Athlete ID generated successfully', { 
        athleteId, 
        playerName: playerData.full_name,
        schoolId: playerData.school_id
      });
      
      return {
        athleteId,
        metadata: {
          generatedAt: new Date().toISOString(),
          sequentialNumber,
          checksum,
          uniqueString: uniqueString.substring(0, 20) + '...' // Truncated for privacy
        }
      };
      
    } catch (error) {
      logger.error('Athlete ID generation failed', { 
        error: error.message,
        playerData: { ...playerData, sensitive: 'redacted' }
      });
      throw error;
    }
  }

  /**
   * Create a unique string based on player data
   */
  createUniqueString(playerData) {
    const components = [
      playerData.full_name?.toLowerCase().replace(/\s+/g, ''),
      playerData.date_of_birth,
      playerData.school_id?.toString(),
      playerData.guardian_name?.toLowerCase().replace(/\s+/g, ''),
      Date.now().toString()
    ].filter(Boolean);
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }

  /**
   * Get next sequential number from database
   */
  async getNextSequentialNumber() {
    try {
      const result = await query('SELECT nextval(\'athlete_id_seq\') as next_number');
      return parseInt(result.rows[0].next_number);
    } catch (error) {
      logger.error('Failed to get next sequential number', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate checksum for athlete ID
   */
  calculateChecksum(baseId, uniqueString) {
    const combined = baseId + uniqueString;
    const hash = crypto.createHash('md5').update(combined).digest('hex');
    
    // Take first 2 characters and ensure they are numeric
    let checksum = '';
    for (let i = 0; i < hash.length && checksum.length < this.checksumLength; i++) {
      const char = hash[i];
      if (/\d/.test(char)) {
        checksum += char;
      }
    }
    
    // If we don't have enough digits, pad with calculated values
    while (checksum.length < this.checksumLength) {
      const sum = baseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      checksum += (sum % 10).toString();
    }
    
    return checksum.substring(0, this.checksumLength);
  }

  /**
   * Verify athlete ID uniqueness
   */
  async verifyUniqueness(athleteId) {
    try {
      const result = await query(
        'SELECT COUNT(*) FROM players WHERE athlete_id = $1',
        [athleteId]
      );
      return parseInt(result.rows[0].count) === 0;
    } catch (error) {
      logger.error('Failed to verify athlete ID uniqueness', { error: error.message });
      return false;
    }
  }

  /**
   * Validate athlete ID format
   */
  validateAthleteId(athleteId) {
    if (!athleteId || typeof athleteId !== 'string') {
      return { valid: false, reason: 'Athlete ID is required and must be a string' };
    }
    
    if (athleteId.length !== this.idLength) {
      return { valid: false, reason: `Athlete ID must be ${this.idLength} characters long` };
    }
    
    if (!athleteId.startsWith(this.prefix)) {
      return { valid: false, reason: `Athlete ID must start with ${this.prefix}` };
    }
    
    const numberPart = athleteId.substring(this.prefix.length, this.idLength - this.checksumLength);
    if (!/^\d+$/.test(numberPart)) {
      return { valid: false, reason: 'Athlete ID number part must contain only digits' };
    }
    
    const checksumPart = athleteId.substring(this.idLength - this.checksumLength);
    if (!/^\d+$/.test(checksumPart)) {
      return { valid: false, reason: 'Athlete ID checksum must contain only digits' };
    }
    
    return { valid: true, reason: 'Athlete ID format is valid' };
  }

  /**
   * Assign athlete ID to player
   */
  async assignAthleteIdToPlayer(playerId, athleteId) {
    try {
      await query(
        'UPDATE players SET athlete_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [athleteId, playerId]
      );
      
      logger.info('Athlete ID assigned to player', { playerId, athleteId });
      return true;
    } catch (error) {
      logger.error('Failed to assign athlete ID to player', { 
        playerId, 
        athleteId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate athlete ID for existing player
   */
  async generateForPlayer(playerId) {
    try {
      // Get player data
      const playerResult = await query(
        'SELECT * FROM players WHERE id = $1',
        [playerId]
      );
      
      if (playerResult.rows.length === 0) {
        throw new Error('Player not found');
      }
      
      const playerData = playerResult.rows[0];
      
      // Check if player already has an athlete ID
      if (playerData.athlete_id) {
        logger.info('Player already has athlete ID', { 
          playerId, 
          existingAthleteId: playerData.athlete_id 
        });
        return {
          athleteId: playerData.athlete_id,
          isNew: false,
          message: 'Player already has an athlete ID'
        };
      }
      
      // Generate new athlete ID
      const result = await this.generateAthleteId(playerData);
      
      // Assign to player
      await this.assignAthleteIdToPlayer(playerId, result.athleteId);
      
      return {
        athleteId: result.athleteId,
        isNew: true,
        metadata: result.metadata,
        message: 'New athlete ID generated and assigned'
      };
      
    } catch (error) {
      logger.error('Failed to generate athlete ID for player', { 
        playerId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Bulk generate athlete IDs for multiple players
   */
  async bulkGenerateAthleteIds(playerIds) {
    try {
      const results = [];
      
      for (const playerId of playerIds) {
        try {
          const result = await this.generateForPlayer(playerId);
          results.push({ playerId, success: true, ...result });
        } catch (error) {
          results.push({ 
            playerId, 
            success: false, 
            error: error.message 
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      logger.info('Bulk athlete ID generation completed', { 
        total: playerIds.length,
        successful,
        failed
      });
      
      return {
        total: playerIds.length,
        successful,
        failed,
        results
      };
      
    } catch (error) {
      logger.error('Bulk athlete ID generation failed', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Search player by athlete ID
   */
  async findPlayerByAthleteId(athleteId) {
    try {
      const validation = this.validateAthleteId(athleteId);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }
      
      const result = await query(
        `SELECT p.*, s.name as school_name, s.school_code 
         FROM players p 
         JOIN schools s ON p.school_id = s.id 
         WHERE p.athlete_id = $1`,
        [athleteId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
      
    } catch (error) {
      logger.error('Failed to find player by athlete ID', { 
        athleteId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get athlete ID statistics
   */
  async getAthleteIdStats() {
    try {
      const stats = await query(`
        SELECT 
          COUNT(*) as total_players,
          COUNT(athlete_id) as players_with_ids,
          COUNT(*) - COUNT(athlete_id) as players_without_ids,
          MIN(athlete_id) as lowest_id,
          MAX(athlete_id) as highest_id
        FROM players
      `);
      
      // Get sequence info safely
      let sequenceInfo = { current: 1000000, next: 1000001 };
      try {
        const sequenceStats = await query(`
          SELECT last_value as current_sequence
          FROM athlete_id_seq
        `);
        
        sequenceInfo.current = parseInt(sequenceStats.rows[0].current_sequence);
        sequenceInfo.next = sequenceInfo.current + 1;
      } catch (seqError) {
        logger.warn('Could not get sequence stats, using defaults', { error: seqError.message });
      }
      
      return {
        players: stats.rows[0],
        sequence: sequenceInfo
      };
      
    } catch (error) {
      logger.error('Failed to get athlete ID stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Get athlete ID statistics (alias for getAthleteIdStats)
   */
  async getStats() {
    return this.getAthleteIdStats();
  }

  /**
   * Generate batch athlete IDs
   */
  async generateBatchIds(options = {}) {
    const { player_ids, school_id, batch_size = 10, generated_by } = options;
    
    try {
      let playersQuery = `
        SELECT id, first_name, last_name, school_id, athlete_id
        FROM players
        WHERE athlete_id IS NULL
      `;
      
      let queryParams = [];
      
      if (player_ids && player_ids.length > 0) {
        playersQuery += ` AND id = ANY($1)`;
        queryParams.push(player_ids);
      } else if (school_id) {
        playersQuery += ` AND school_id = $1`;
        queryParams.push(school_id);
      }
      
      playersQuery += ` LIMIT $${queryParams.length + 1}`;
      queryParams.push(batch_size);
      
      const playersResult = await query(playersQuery, queryParams);
      
      const results = {
        generated_count: 0,
        skipped_count: 0,
        generated_ids: []
      };
      
      for (const player of playersResult.rows) {
        try {
          const playerData = {
            full_name: `${player.first_name} ${player.last_name}`,
            school_id: player.school_id,
            player_id: player.id
          };
          
          const idResult = await this.generateAthleteId(playerData);
          
          // Update player with new athlete ID
          await query(
            'UPDATE players SET athlete_id = $1 WHERE id = $2',
            [idResult.athleteId, player.id]
          );
          
          results.generated_count++;
          results.generated_ids.push({
            player_id: player.id,
            athlete_id: idResult.athleteId,
            metadata: idResult.metadata
          });
          
        } catch (error) {
          logger.error('Failed to generate ID for player', { 
            playerId: player.id, 
            error: error.message 
          });
          results.skipped_count++;
        }
      }
      
      return results;
      
    } catch (error) {
      logger.error('Batch ID generation failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = AthleteIdGenerator;
