// Enhanced Athlete Routes (modernized with unified sendResponse helper)
// Swagger tags: Enhanced Athletes
/**
 * @swagger
 * tags:
 *   name: EnhancedAthletes
 *   description: Advanced athlete registration & management endpoints (unified response envelope)
 */
/**
 * @swagger
 * /api/enhanced-athletes/register/school:
 *   post:
 *     summary: Register an athlete via a School Admin
 *     tags: [EnhancedAthletes]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [full_name, date_of_birth, school_id, gender]
 *             properties:
 *               full_name: { type: string }
 *               date_of_birth: { type: string, format: date }
 *               school_id: { type: integer }
 *               gender: { type: string }
 *               class: { type: string }
 *               section: { type: string }
 *               guardian_name: { type: string }
 *               guardian_phone: { type: string }
 *               guardian_email: { type: string }
 *               address: { type: string }
 *               interested_sports: { type: array, items: { type: string } }
 *               profile_photo: { type: string, format: binary }
 *               birth_certificate: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Athlete created (pending verification)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       409:
 *         description: Duplicate athlete
 *       400:
 *         description: Validation error
 * /api/enhanced-athletes/register/guardian:
 *   post:
 *     summary: Guardian initiated athlete registration
 *     tags: [EnhancedAthletes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [athlete_name, athlete_dob, guardian_name, guardian_phone]
 *             properties:
 *               athlete_name: { type: string }
 *               athlete_dob: { type: string, format: date }
 *               guardian_name: { type: string }
 *               guardian_phone: { type: string }
 *               guardian_email: { type: string }
 *               school_id: { type: integer }
 *               registration_code: { type: string }
 *               interested_sports: { type: array, items: { type: string } }
 *               profile_photo: { type: string, format: binary }
 *               birth_certificate: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Athlete submitted for school approval
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericResponse'
 *       400: { description: Invalid registration code }
 * /api/enhanced-athletes/register/direct:
 *   post:
 *     summary: Direct self registration
 *     tags: [EnhancedAthletes]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [full_name, date_of_birth, email]
 *             properties:
 *               full_name: { type: string }
 *               date_of_birth: { type: string, format: date }
 *               email: { type: string }
 *               phone: { type: string }
 *               school_id: { type: integer }
 *               invitation_code: { type: string }
 *               interested_sports: { type: array, items: { type: string } }
 *               profile_photo: { type: string, format: binary }
 *               birth_certificate: { type: string, format: binary }
 *     responses:
 *       201: { description: Athlete pending verification }
 *       400: { description: Invalid invitation code }
 * /api/enhanced-athletes/claim:
 *   post:
 *     summary: Claim an athlete profile using claim code
 *     tags: [EnhancedAthletes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claim_code, verification_method]
 *             properties:
 *               claim_code: { type: string }
 *               verification_method: { type: string, example: email }
 *     responses:
 *       200: { description: Verification initiated }
 *       404: { description: Invalid claim code }
 * /api/enhanced-athletes/{athleteId}/profile:
 *   put:
 *     summary: Update athlete extended profile
 *     tags: [EnhancedAthletes]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: athleteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guardian_contacts: { type: array, items: { type: object } }
 *               medical_notes: { type: string }
 *               interested_sports: { type: array, items: { type: string } }
 *               privacy_settings: { type: object }
 *               emergency_contact: { type: object }
 *     responses:
 *       200: { description: Profile updated }
 *       404: { description: Athlete not found }
 * /api/enhanced-athletes/{athleteId}/sports:
 *   post:
 *     summary: Assign / upsert athlete sport participation
 *     tags: [EnhancedAthletes]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: athleteId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sport_id]
 *             properties:
 *               sport_id: { type: integer }
 *               age_group: { type: string }
 *               team_id: { type: integer }
 *               skill_level: { type: string }
 *               position: { type: string }
 *     responses:
 *       201: { description: Assignment created/updated }
 *       404: { description: Athlete not verified }
 * /api/enhanced-athletes/bulk-upload:
 *   post:
 *     summary: Bulk create athletes for a school
 *     tags: [EnhancedAthletes]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [athletes, school_id]
 *             properties:
 *               school_id: { type: integer }
 *               auto_generate_codes: { type: boolean }
 *               athletes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [full_name, date_of_birth]
 *                   properties:
 *                     full_name: { type: string }
 *                     date_of_birth: { type: string, format: date }
 *                     gender: { type: string }
 *                     class: { type: string }
 *     responses:
 *       201: { description: Bulk upload summary returned }
 * /api/enhanced-athletes/transfer:
 *   post:
 *     summary: Submit athlete transfer request
 *     tags: [EnhancedAthletes]
 *     security: [{ cookieAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [athlete_id, current_school_id, target_school_id]
 *             properties:
 *               athlete_id: { type: string }
 *               current_school_id: { type: integer }
 *               target_school_id: { type: integer }
 *               transfer_reason: { type: string }
 *               guardian_approval: { type: boolean }
 *               effective_date: { type: string, format: date }
 *     responses:
 *       201: { description: Transfer request submitted }
 * /api/enhanced-athletes/search:
 *   get:
 *     summary: Search athletes with filters & pagination
 *     tags: [EnhancedAthletes]
 *     security: [{ cookieAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *       - in: query
 *         name: school_id
 *         schema: { type: integer }
 *       - in: query
 *         name: sport
 *         schema: { type: string }
 *       - in: query
 *         name: age_group
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25 }
 *     responses:
 *       200: { description: Athletes & pagination meta }
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const { generateShortCode } = require('../utils/codeGenerator');
const { protect, checkRole } = require('../middlewares/authMiddleware');
const { sendResponse } = require('../utils/response');
const {
	validateSchoolAthleteRegistration,
	validateGuardianAthleteRegistration,
	validateDirectAthleteRegistration,
	validateAthleteProfileClaim,
	validateAthleteProfileUpdate,
	validateSportsAssignment,
	validateAthleteTransfer,
	validateBulkAthleteUpload
} = require('../middlewares/validation');
const { generalLimiter } = require('../middlewares/rateLimiter');

// Multer setup
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const subfolder = file.fieldname === 'birth_certificate' ? 'documents' : 'photos';
		cb(null, `uploads/athletes/${subfolder}/`);
	},
	filename: (req, file, cb) => {
		const timestamp = Date.now();
		const originalName = file.originalname.replace(/\s+/g, '_');
		cb(null, `athlete-${timestamp}-${originalName}`);
	}
});

const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		if (file.fieldname === 'profile_photo') {
			if (file.mimetype.startsWith('image/')) return cb(null, true);
			return cb(new Error('Profile photo must be an image file'));
		}
		if (file.fieldname === 'birth_certificate') {
			if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) return cb(null, true);
			return cb(new Error('Birth certificate must be PDF or image file'));
		}
		cb(null, true);
	},
	limits: { fileSize: 5 * 1024 * 1024 }
});

// 1. School Admin Registration
router.post(
	'/register/school',
	generalLimiter,
	protect,
	checkRole(['SchoolAdmin', 'SuperAdmin']),
	upload.fields([
		{ name: 'profile_photo', maxCount: 1 },
		{ name: 'birth_certificate', maxCount: 1 }
	]),
	validateSchoolAthleteRegistration,
	async (req, res, next) => {
		try {
			const {
				full_name,
				date_of_birth,
				school_id,
				gender,
				class: studentClass,
				section,
				guardian_name,
				guardian_phone,
				guardian_email,
				address,
				interested_sports
			} = req.body;
			const created_by = req.user.id;

			const exists = await pool.query(
				'SELECT id FROM players WHERE LOWER(full_name)=LOWER($1) AND date_of_birth=$2 AND school_id=$3',
				[full_name.trim(), date_of_birth, school_id]
			);
			if (exists.rowCount > 0) {
				return sendResponse(res, { success: false, status: 409, message: 'An athlete with this name and date of birth is already registered for this school.' });
			}

			const claim_code = await generateShortCode('CLAIM', 12);
			const photo_url = req.files?.profile_photo?.[0]?.filename || null;
			const birth_cert_url = req.files?.birth_certificate?.[0]?.filename || null;

			const insertQuery = `
				INSERT INTO players (
					athlete_id, full_name, date_of_birth, school_id, gender, class, section,
					guardian_name, guardian_phone, guardian_email, address,
					profile_photo_url, birth_cert_url, created_by, is_active,
					status, claim_code, interested_sports
				) VALUES (
					generate_athlete_id(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE,
					'pending_verification', $14, $15
				) RETURNING *;`;

			const values = [
				full_name.trim(), date_of_birth, school_id, gender, studentClass, section,
				guardian_name, guardian_phone, guardian_email, address,
				photo_url, birth_cert_url, created_by, claim_code,
				JSON.stringify(interested_sports || [])
			];

			const result = await pool.query(insertQuery, values);
			const athlete = result.rows[0];

			return sendResponse(res, { status: 201, message: 'Athlete registered successfully via school admin.', data: { athlete: { ...athlete, claim_url: `${process.env.FRONTEND_URL}/claim/${claim_code}` } } });
		} catch (err) { next(err); }
	}
);

// 2. Guardian Registration
router.post(
	'/register/guardian',
	generalLimiter,
	upload.fields([
		{ name: 'profile_photo', maxCount: 1 },
		{ name: 'birth_certificate', maxCount: 1 }
	]),
	validateGuardianAthleteRegistration,
	async (req, res, next) => {
		try {
			const { athlete_name, athlete_dob, guardian_name, guardian_phone, guardian_email, school_id, registration_code, interested_sports } = req.body;
			if (registration_code) {
				const codeCheck = await pool.query('SELECT school_id FROM registration_codes WHERE code = $1 AND is_active = TRUE AND expires_at > NOW()', [registration_code]);
				if (codeCheck.rowCount === 0) {
					return sendResponse(res, { success: false, status: 400, message: 'Invalid or expired registration code.' });
				}
			}
			const photo_url = req.files?.profile_photo?.[0]?.filename || null;
			const birth_cert_url = req.files?.birth_certificate?.[0]?.filename || null;
			const insertQuery = `
				INSERT INTO players (
					athlete_id, full_name, date_of_birth, school_id,
					guardian_name, guardian_phone, guardian_email,
					profile_photo_url, birth_cert_url, is_active,
					status, registration_method, interested_sports
				) VALUES (
					generate_athlete_id(), $1, $2, $3, $4, $5, $6, $7, $8, TRUE,
					'pending_approval', 'guardian_registration', $9
				) RETURNING *;`;
			const values = [athlete_name.trim(), athlete_dob, school_id, guardian_name, guardian_phone, guardian_email, photo_url, birth_cert_url, JSON.stringify(interested_sports || [])];
			const result = await pool.query(insertQuery, values);
			return sendResponse(res, { status: 201, message: 'Athlete registration submitted for school approval.', data: { athlete: result.rows[0] } });
		} catch (err) { next(err); }
	}
);

// 3. Direct Registration
router.post(
	'/register/direct',
	generalLimiter,
	upload.fields([
		{ name: 'profile_photo', maxCount: 1 },
		{ name: 'birth_certificate', maxCount: 1 }
	]),
	validateDirectAthleteRegistration,
	async (req, res, next) => {
		try {
			const { full_name, date_of_birth, email, phone, school_id, invitation_code, interested_sports } = req.body;
			if (invitation_code) {
				const codeCheck = await pool.query('SELECT school_id FROM invitation_codes WHERE code = $1 AND is_active = TRUE AND expires_at > NOW()', [invitation_code]);
				if (codeCheck.rowCount === 0) {
					return sendResponse(res, { success: false, status: 400, message: 'Invalid or expired invitation code.' });
				}
			}
			const photo_url = req.files?.profile_photo?.[0]?.filename || null;
			const birth_cert_url = req.files?.birth_certificate?.[0]?.filename || null;
			const insertQuery = `
				INSERT INTO players (
					athlete_id, full_name, date_of_birth, school_id, email, contact_no,
					profile_photo_url, birth_cert_url, is_active,
					status, registration_method, interested_sports
				) VALUES (
					generate_athlete_id(), $1, $2, $3, $4, $5, $6, $7, TRUE,
					'pending_verification', 'direct_registration', $8
				) RETURNING *;`;
			const values = [full_name.trim(), date_of_birth, school_id, email, phone, photo_url, birth_cert_url, JSON.stringify(interested_sports || [])];
			const result = await pool.query(insertQuery, values);
			return sendResponse(res, { status: 201, message: 'Athlete registration submitted for verification.', data: { athlete: result.rows[0] } });
		} catch (err) { next(err); }
	}
);

// 4. Claim Profile
router.post('/claim', generalLimiter, validateAthleteProfileClaim, async (req, res, next) => {
	try {
		const { claim_code, verification_method } = req.body;
		const athlete = await pool.query("SELECT * FROM players WHERE claim_code = $1 AND status = 'pending_verification'", [claim_code]);
		if (athlete.rowCount === 0) {
			return sendResponse(res, { success: false, status: 404, message: 'Invalid claim code or profile already claimed.' });
		}
		return sendResponse(res, { message: `Verification code sent via ${verification_method}.`, data: { athlete_id: athlete.rows[0].athlete_id } });
	} catch (err) { next(err); }
});

// 5. Update Profile
router.put('/:athleteId/profile', generalLimiter, protect, validateAthleteProfileUpdate, async (req, res, next) => {
	try {
		const { athleteId } = req.params;
		const { guardian_contacts, medical_notes, interested_sports, privacy_settings, emergency_contact } = req.body;
		const updateQuery = `
			UPDATE players SET
				guardian_contacts = $1,
				medical_notes = $2,
				interested_sports = $3,
				privacy_settings = $4,
				emergency_contact = $5,
				updated_at = CURRENT_TIMESTAMP
			WHERE athlete_id = $6 RETURNING *;`;
		const values = [JSON.stringify(guardian_contacts), medical_notes, JSON.stringify(interested_sports), JSON.stringify(privacy_settings), JSON.stringify(emergency_contact), athleteId];
		const result = await pool.query(updateQuery, values);
		if (result.rowCount === 0) return sendResponse(res, { success: false, status: 404, message: 'Athlete not found.' });
		return sendResponse(res, { message: 'Athlete profile updated successfully.', data: { athlete: result.rows[0] } });
	} catch (err) { next(err); }
});

// 6. Assign Sports
router.post('/:athleteId/sports', generalLimiter, protect, checkRole(['SchoolAdmin', 'Coach']), validateSportsAssignment, async (req, res, next) => {
	try {
		const { athleteId } = req.params;
		const { sport_id, age_group, team_id, skill_level, position } = req.body;
		const athlete = await pool.query("SELECT * FROM players WHERE athlete_id = $1 AND status = 'verified'", [athleteId]);
		if (athlete.rowCount === 0) return sendResponse(res, { success: false, status: 404, message: 'Athlete not found or not verified.' });
		const assignmentQuery = `
			INSERT INTO athlete_sport_assignments (
				athlete_id, sport_id, age_group, team_id, skill_level, position, assigned_by
			) VALUES ($1,$2,$3,$4,$5,$6,$7)
			ON CONFLICT (athlete_id, sport_id) DO UPDATE SET
				age_group=EXCLUDED.age_group, team_id=EXCLUDED.team_id, skill_level=EXCLUDED.skill_level, position=EXCLUDED.position, updated_at=CURRENT_TIMESTAMP
			RETURNING *;`;
		const values = [athleteId, sport_id, age_group, team_id, skill_level, position, req.user.id];
		const result = await pool.query(assignmentQuery, values);
		return sendResponse(res, { status: 201, message: 'Athlete assigned to sport successfully.', data: { assignment: result.rows[0] } });
	} catch (err) { next(err); }
});

// 7. Bulk Upload
router.post('/bulk-upload', generalLimiter, protect, checkRole(['SchoolAdmin']), validateBulkAthleteUpload, async (req, res, next) => {
	const client = await pool.connect();
	try {
		const { athletes, school_id, auto_generate_codes } = req.body; const created_by = req.user.id;
		await client.query('BEGIN');
		const results = []; const errors = [];
		for (let i = 0; i < athletes.length; i++) {
			const athlete = athletes[i];
			try {
				const exists = await client.query('SELECT id FROM players WHERE LOWER(full_name)=LOWER($1) AND date_of_birth=$2 AND school_id=$3', [athlete.full_name.trim(), athlete.date_of_birth, school_id]);
				if (exists.rowCount > 0) { errors.push({ row: i + 1, name: athlete.full_name, error: 'Duplicate athlete found' }); continue; }
				const claim_code = auto_generate_codes ? await generateShortCode('CLAIM', 12) : null;
				const insertQuery = `
					INSERT INTO players (
						athlete_id, full_name, date_of_birth, school_id, gender, class,
						created_by, is_active, status, claim_code
					) VALUES (
						generate_athlete_id(), $1, $2, $3, $4, $5, $6, TRUE, 'pending_verification', $7
					) RETURNING athlete_id, full_name, claim_code;`;
				const values = [athlete.full_name.trim(), athlete.date_of_birth, school_id, athlete.gender || null, athlete.class || null, created_by, claim_code];
				const result = await client.query(insertQuery, values);
				results.push(result.rows[0]);
			} catch (error) {
				errors.push({ row: i + 1, name: athlete.full_name, error: error.message });
			}
		}
		await client.query('COMMIT');
		return sendResponse(res, { status: 201, message: `Bulk upload completed. ${results.length} athletes created, ${errors.length} errors.`, data: { successful: results, errors, summary: { total: athletes.length, successful: results.length, failed: errors.length } } });
	} catch (err) {
		await client.query('ROLLBACK');
		return next(err);
	} finally { client.release(); }
});

// 8. Transfer Request
router.post('/transfer', generalLimiter, protect, validateAthleteTransfer, async (req, res, next) => {
	try {
		const { athlete_id, current_school_id, target_school_id, transfer_reason, guardian_approval, effective_date } = req.body;
		const transferQuery = `
			INSERT INTO athlete_transfers (
				athlete_id, current_school_id, target_school_id, transfer_reason,
				guardian_approval, effective_date, requested_by, status
			) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *;`;
		const values = [athlete_id, current_school_id, target_school_id, transfer_reason, guardian_approval, effective_date || null, req.user.id];
		const result = await pool.query(transferQuery, values);
		return sendResponse(res, { status: 201, message: 'Transfer request submitted successfully.', data: { transfer: result.rows[0] } });
	} catch (err) { next(err); }
});

// 9. Search
router.get('/search', protect, async (req, res, next) => {
	try {
		const { query, school_id, sport, age_group, status, page = 1, limit = 25 } = req.query;
		const offset = (page - 1) * limit; const conditions = []; const values = []; let paramIndex = 1;
		let baseQuery = `FROM players p LEFT JOIN schools s ON p.school_id = s.id LEFT JOIN athlete_sport_assignments asa ON p.athlete_id = asa.athlete_id LEFT JOIN sports sp ON asa.sport_id = sp.id`;
		if (query) { conditions.push(`(p.full_name ILIKE $${paramIndex} OR p.athlete_id ILIKE $${paramIndex})`); values.push(`%${query}%`); paramIndex++; }
		if (school_id) { conditions.push(`p.school_id = $${paramIndex}`); values.push(school_id); paramIndex++; }
		if (sport) { conditions.push(`sp.name ILIKE $${paramIndex}`); values.push(`%${sport}%`); paramIndex++; }
		if (age_group) { conditions.push(`asa.age_group = $${paramIndex}`); values.push(age_group); paramIndex++; }
		if (status) { conditions.push(`p.status = $${paramIndex}`); values.push(status); paramIndex++; }
		if (conditions.length) baseQuery += ` WHERE ${conditions.join(' AND ')}`;
		const totalResult = await pool.query(`SELECT COUNT(DISTINCT p.id) ${baseQuery}`, values);
		const total = parseInt(totalResult.rows[0].count, 10);
		const athletesQuery = `SELECT DISTINCT p.athlete_id, p.full_name, p.date_of_birth, p.gender, p.class, p.status, s.name AS school_name, s.school_code, p.profile_photo_url, p.created_at ${baseQuery} ORDER BY p.full_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
		const result = await pool.query(athletesQuery, [...values, limit, offset]);
		return sendResponse(res, { data: { athletes: result.rows, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total, limit: parseInt(limit) } } });
	} catch (err) { next(err); }
});

module.exports = router;
