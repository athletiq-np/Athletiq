// Tournament templates for quick setup
export const tournamentTemplates = {
  interschool: {
    id: 'interschool',
    name: 'Inter-School Championship',
    description: 'Standard inter-school tournament with multiple sports',
    category: 'Championship',
    icon: '🏆',
    config: {
      format: 'knockout',
      registrationDeadline: 7, // days from now
      maxTeamsPerSchool: 2,
      ageCategories: ['Under 16', 'Under 18', 'Open'],
      duration: 3, // days
      sports: [
        'football',
        'basketball',
        'volleyball',
        'badminton',
        'table-tennis',
        'cricket'
      ],
      sportConfig: {
        football: { format: 'knockout', maxTeams: 16 },
        basketball: { format: 'knockout', maxTeams: 8 },
        volleyball: { format: 'round-robin', maxTeams: 6 },
        badminton: { format: 'knockout', maxTeams: 32 },
        'table-tennis': { format: 'knockout', maxTeams: 16 },
        cricket: { format: 'knockout', maxTeams: 8 }
      }
    }
  },
  
  seasonal: {
    id: 'seasonal',
    name: 'Seasonal League',
    description: 'Long-term league format for seasonal sports',
    category: 'League',
    icon: '🏅',
    config: {
      format: 'league',
      registrationDeadline: 14,
      maxTeamsPerSchool: 1,
      ageCategories: ['Open'],
      duration: 90, // days
      sports: [
        'football',
        'basketball',
        'cricket'
      ],
      sportConfig: {
        football: { format: 'league', maxTeams: 12 },
        basketball: { format: 'league', maxTeams: 10 },
        cricket: { format: 'league', maxTeams: 8 }
      }
    }
  },
  
  indoor: {
    id: 'indoor',
    name: 'Indoor Sports Tournament',
    description: 'Quick indoor sports tournament',
    category: 'Indoor',
    icon: '🏓',
    config: {
      format: 'knockout',
      registrationDeadline: 3,
      maxTeamsPerSchool: 3,
      ageCategories: ['Under 16', 'Under 18'],
      duration: 1,
      sports: [
        'badminton',
        'table-tennis',
        'chess',
        'carrom'
      ],
      sportConfig: {
        badminton: { format: 'knockout', maxTeams: 16 },
        'table-tennis': { format: 'knockout', maxTeams: 16 },
        chess: { format: 'round-robin', maxTeams: 8 },
        carrom: { format: 'knockout', maxTeams: 8 }
      }
    }
  },
  
  athletics: {
    id: 'athletics',
    name: 'Athletics Meet',
    description: 'Track and field athletics competition',
    category: 'Athletics',
    icon: '🏃',
    config: {
      format: 'round-robin',
      registrationDeadline: 10,
      maxTeamsPerSchool: 5,
      ageCategories: ['Under 14', 'Under 16', 'Under 18'],
      duration: 2,
      sports: [
        'athletics',
        'swimming'
      ],
      sportConfig: {
        athletics: { format: 'round-robin', maxTeams: 20 },
        swimming: { format: 'round-robin', maxTeams: 15 }
      }
    }
  },
  
  cultural: {
    id: 'cultural',
    name: 'Cultural & Sports Fest',
    description: 'Combined cultural and sports event',
    category: 'Festival',
    icon: '🎭',
    config: {
      format: 'knockout',
      registrationDeadline: 14,
      maxTeamsPerSchool: 4,
      ageCategories: ['Under 16', 'Under 18', 'Open'],
      duration: 4,
      sports: [
        'football',
        'basketball',
        'badminton',
        'table-tennis',
        'chess',
        'cultural-dance',
        'music',
        'drama'
      ],
      sportConfig: {
        football: { format: 'knockout', maxTeams: 8 },
        basketball: { format: 'knockout', maxTeams: 8 },
        badminton: { format: 'knockout', maxTeams: 16 },
        'table-tennis': { format: 'knockout', maxTeams: 16 },
        chess: { format: 'round-robin', maxTeams: 8 },
        'cultural-dance': { format: 'knockout', maxTeams: 12 },
        music: { format: 'knockout', maxTeams: 10 },
        drama: { format: 'knockout', maxTeams: 8 }
      }
    }
  }
};

export const templateCategories = {
  'Championship': {
    name: 'Championship',
    description: 'Competitive tournaments with elimination format',
    color: '#FFD700',
    icon: '🏆'
  },
  'League': {
    name: 'League',
    description: 'Long-term league format competitions',
    color: '#4CAF50',
    icon: '🏅'
  },
  'Indoor': {
    name: 'Indoor Sports',
    description: 'Indoor sports and games',
    color: '#2196F3',
    icon: '🏓'
  },
  'Athletics': {
    name: 'Athletics',
    description: 'Track and field events',
    color: '#FF9800',
    icon: '🏃'
  },
  'Festival': {
    name: 'Festival',
    description: 'Combined cultural and sports events',
    color: '#9C27B0',
    icon: '🎭'
  }
};

// Helper functions
export const getTemplatesByCategory = (category) => {
  return Object.values(tournamentTemplates).filter(
    template => template.category === category
  );
};

export const getTemplateById = (id) => {
  return tournamentTemplates[id];
};

export const getAllTemplates = () => {
  return Object.values(tournamentTemplates);
};

export const createTournamentFromTemplate = (templateId, customData = {}) => {
  const template = getTemplateById(templateId);
  if (!template) return null;
  
  const registrationDeadline = new Date();
  registrationDeadline.setDate(registrationDeadline.getDate() + template.config.registrationDeadline);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + template.config.registrationDeadline + 1);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + template.config.duration);
  
  return {
    name: customData.name || template.name,
    description: customData.description || template.description,
    category: template.category,
    format: template.config.format,
    registrationDeadline: registrationDeadline.toISOString().split('T')[0],
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    maxTeamsPerSchool: template.config.maxTeamsPerSchool,
    ageCategories: [...template.config.ageCategories],
    sports: [...template.config.sports],
    sportConfig: { ...template.config.sportConfig },
    templateId: templateId,
    ...customData
  };
};
