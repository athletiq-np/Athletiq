// Nepal Athlete ID Utilities - Production Helper Functions
const AthleteIdGenerator = require('../services/ai/athleteIdGenerator');
const { validateCodeStrength } = require('./codeGenerator');

class NepalAthleteUtils {
  constructor() {
    this.generator = new AthleteIdGenerator();
  }

  /**
   * Validate a Nepal athlete ID format
   * @param {string} athleteId - The athlete ID to validate
   * @returns {object} Validation result
   */
  validateAthleteId(athleteId) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: {}
    };

    // Basic format checks
    if (!athleteId || typeof athleteId !== 'string') {
      result.isValid = false;
      result.errors.push('Athlete ID must be a non-empty string');
      return result;
    }

    if (athleteId.length !== 8) {
      result.isValid = false;
      result.errors.push(`Invalid length: ${athleteId.length}. Must be exactly 8 characters`);
    }

    if (!athleteId.startsWith('NP')) {
      result.isValid = false;
      result.errors.push('Must start with "NP" country code');
    }

    // Check for ambiguous characters
    const ambiguousChars = athleteId.match(/[IO01]/g);
    if (ambiguousChars) {
      result.isValid = false;
      result.errors.push(`Contains ambiguous characters: ${ambiguousChars.join(', ')}`);
    }

    // Check alphanumeric format
    const codePartition = athleteId.slice(2);
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(codePartition)) {
      result.isValid = false;
      result.errors.push('Invalid characters in code portion');
    }

    // Add metadata
    result.metadata = {
      prefix: athleteId.slice(0, 2),
      code: codePartition,
      length: athleteId.length,
      format: 'Nepal Standard (NP + 6 alphanumeric)'
    };

    return result;
  }

  /**
   * Convert legacy athlete IDs to Nepal format
   * @param {string} legacyId - Legacy athlete ID (UUID or other format)
   * @returns {string} New Nepal format ID
   */
  convertLegacyId(legacyId) {
    // Generate a new Nepal ID as we can't maintain mapping without losing uniqueness
    const newCode = this.generator.generateAlphanumericCode();
    return `NP${newCode}`;
  }

  /**
   * Generate athlete IDs for bulk import
   * @param {number} count - Number of IDs to generate
   * @returns {Array<string>} Array of unique athlete IDs
   */
  generateBulkIds(count) {
    const ids = new Set();
    const maxAttempts = count * 3; // Safety limit
    let attempts = 0;

    while (ids.size < count && attempts < maxAttempts) {
      const code = this.generator.generateAlphanumericCode();
      ids.add(`NP${code}`);
      attempts++;
    }

    if (ids.size < count) {
      throw new Error(`Could only generate ${ids.size} unique IDs out of ${count} requested`);
    }

    return Array.from(ids);
  }

  /**
   * Analyze athlete ID for potential issues
   * @param {string} athleteId - The athlete ID to analyze
   * @returns {object} Analysis result
   */
  analyzeAthleteId(athleteId) {
    const validation = this.validateAthleteId(athleteId);
    const strength = validateCodeStrength(athleteId.slice(2));

    return {
      validation,
      strength: {
        score: strength.score,
        level: strength.strength,
        issues: strength.issues
      },
      recommendations: this.getRecommendations(validation, strength)
    };
  }

  /**
   * Get recommendations for athlete ID improvements
   * @param {object} validation - Validation result
   * @param {object} strength - Strength analysis
   * @returns {Array<string>} Recommendations
   */
  getRecommendations(validation, strength) {
    const recommendations = [];

    if (!validation.isValid) {
      recommendations.push('Regenerate ID to fix validation errors');
    }

    if (strength.strength === 'weak') {
      recommendations.push('Consider regenerating for better entropy');
    }

    if (strength.issues.length > 0) {
      recommendations.push('Address pattern issues for better security');
    }

    if (recommendations.length === 0) {
      recommendations.push('ID meets all quality standards');
    }

    return recommendations;
  }

  /**
   * Generate summary statistics for a batch of athlete IDs
   * @param {Array<string>} athleteIds - Array of athlete IDs
   * @returns {object} Statistics summary
   */
  generateBatchStatistics(athleteIds) {
    const stats = {
      total: athleteIds.length,
      valid: 0,
      invalid: 0,
      duplicates: 0,
      formatErrors: [],
      uniqueIds: new Set(),
      characterDistribution: {},
      strengthDistribution: { weak: 0, medium: 0, strong: 0 }
    };

    athleteIds.forEach((id, index) => {
      const validation = this.validateAthleteId(id);
      
      if (validation.isValid) {
        stats.valid++;
        
        if (stats.uniqueIds.has(id)) {
          stats.duplicates++;
        } else {
          stats.uniqueIds.add(id);
        }

        // Character distribution analysis
        const code = id.slice(2);
        for (const char of code) {
          stats.characterDistribution[char] = (stats.characterDistribution[char] || 0) + 1;
        }

        // Strength analysis
        const strength = validateCodeStrength(code);
        stats.strengthDistribution[strength.strength]++;
      } else {
        stats.invalid++;
        stats.formatErrors.push({ index, id, errors: validation.errors });
      }
    });

    // Calculate additional metrics
    stats.uniquenessRate = ((stats.total - stats.duplicates) / stats.total * 100).toFixed(2);
    stats.validityRate = (stats.valid / stats.total * 100).toFixed(2);

    return stats;
  }
}

module.exports = NepalAthleteUtils;

// CLI Usage Example
if (require.main === module) {
  const utils = new NepalAthleteUtils();
  
  console.log('🛠️  NEPAL ATHLETE ID UTILITIES - DEMO');
  console.log('='.repeat(50));
  
  // Generate sample IDs
  const sampleIds = utils.generateBulkIds(5);
  console.log('\n📋 Generated Sample IDs:');
  sampleIds.forEach((id, index) => {
    console.log(`${index + 1}. ${id}`);
  });
  
  // Validate first ID
  console.log('\n🔍 Validation Example:');
  const validation = utils.validateAthleteId(sampleIds[0]);
  console.log(`ID: ${sampleIds[0]}`);
  console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);
  console.log(`Format: ${validation.metadata.format}`);
  
  // Batch statistics
  console.log('\n📊 Batch Statistics:');
  const stats = utils.generateBatchStatistics(sampleIds);
  console.log(`Total IDs: ${stats.total}`);
  console.log(`Valid: ${stats.valid} (${stats.validityRate}%)`);
  console.log(`Unique: ${stats.uniqueIds.size} (${stats.uniquenessRate}% uniqueness)`);
  
  console.log('\n✅ Utilities ready for production use!');
}
