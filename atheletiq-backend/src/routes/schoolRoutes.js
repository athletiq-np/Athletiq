/**
 * @route   GET /api/schools/activities
 * @desc    Get activities for the school (mock data for now)
 * @access  Private (SchoolAdmin)
 */
router.get('/activities', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolActivities);

/**
 * TEAM MANAGEMENT ROUTES
 */

/**
 * @route   POST /api/schools/me/teams
 * @desc    Create a new team for the school
 * @access  Private (SchoolAdmin)
 */
router.post('/me/teams', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.createSchoolTeam);

/**
 * @route   PATCH /api/schools/me/teams/:id
 * @desc    Update a team for the school
 * @access  Private (SchoolAdmin)
 */
router.patch('/me/teams/:id', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.updateSchoolTeam);

/**
 * @route   DELETE /api/schools/me/teams/:id
 * @desc    Delete a team for the school
 * @access  Private (SchoolAdmin)
 */
router.delete('/me/teams/:id', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.deleteSchoolTeam);

/**
 * @route   GET /api/schools/me/teams/:id
 * @desc    Get a specific team with players
 * @access  Private (SchoolAdmin)
 */
router.get('/me/teams/:id', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.getSchoolTeam);

/**
 * @route   POST /api/schools/me/teams/:id/players
 * @desc    Add a player to a team
 * @access  Private (SchoolAdmin)
 */
router.post('/me/teams/:id/players', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.addPlayerToTeam);

/**
 * @route   DELETE /api/schools/me/teams/:id/players/:playerId
 * @desc    Remove a player from a team
 * @access  Private (SchoolAdmin)
 */
router.delete('/me/teams/:id/players/:playerId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.removePlayerFromTeam);

/**
 * @route   PATCH /api/schools/me/teams/:id/players/:playerId
 * @desc    Update a player's position in a team
 * @access  Private (SchoolAdmin)
 */
router.patch('/me/teams/:id/players/:playerId', generalLimiter, protect, checkRole(['SchoolAdmin']), schoolController.updatePlayerPosition);