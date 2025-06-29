//
// 🧠 ATHLETIQ - Authentication Controller
//
// This file contains the core logic for user registration and login.
// It interacts directly with the 'users' and 'schools' tables in the database.
//

// --- MODULE IMPORTS ---
const pool = require('../config/db'); // Imports the database connection pool
const bcrypt = require('bcryptjs');   // For hashing passwords securely
const jwt = require('jsonwebtoken');  // For creating JSON Web Tokens (JWT) for authentication

// --- CONTROLLER FUNCTIONS ---

/**
 * @desc    Register a new School Admin and their associated School.
 * This function performs a database transaction to ensure that both the
 * school and the user are created successfully, or neither is.
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  // 1. Destructure required data from the request body
  const {
    adminFullName,
    adminEmail,
    password,
    schoolName,
    schoolCode,
    schoolAddress,
    schoolEmail
  } = req.body;

  // 2. Validate that all essential fields are present
  if (!adminFullName || !adminEmail || !password || !schoolName || !schoolCode) {
    return res.status(400).json({ message: 'Please provide all required fields for admin and school.' });
  }

  // 3. Get a client from the connection pool for transaction management
  const client = await pool.connect();

  try {
    // 4. Check if a user with the same email already exists to prevent duplicates
    const userExists = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (userExists.rowCount > 0) {
      return res.status(409).json({ message: 'An administrator with this email already exists.' });
    }

    // 5. Check if a school with the same code already exists
    const schoolExists = await client.query('SELECT id FROM schools WHERE school_code = $1', [schoolCode]);
    if (schoolExists.rowCount > 0) {
      return res.status(409).json({ message: 'A school with this code already exists.' });
    }

    // --- DATABASE TRANSACTION START ---
    await client.query('BEGIN');

    // 6. Create the School record first
    const newSchoolQuery = `
      INSERT INTO schools (school_code, name, address, email, admin_email, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id;
    `;
    const schoolResult = await client.query(newSchoolQuery, [schoolCode, schoolName, schoolAddress, schoolEmail || adminEmail, adminEmail]);
    const newSchoolId = schoolResult.rows[0].id;

    // 7. Securely hash the user's password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 8. Create the User record, linking it to the newly created school
    const newUserQuery = `
      INSERT INTO users (full_name, email, password_hash, role, school_id)
      VALUES ($1, $2, $3, 'SchoolAdmin', $4)
      RETURNING id, full_name, email, role;
    `;
    const userResult = await client.query(newUserQuery, [adminFullName, adminEmail, passwordHash, newSchoolId]);
    const newUser = userResult.rows[0];

    // --- DATABASE TRANSACTION COMMIT ---
    // If all queries were successful, commit the changes to the database.
    await client.query('COMMIT');

    // 9. Create a JWT payload with essential user info
    const payload = {
      user: {
        id: newUser.id,
        role: newUser.role,
        school_id: newSchoolId,
      },
    };

    // 10. Sign the token and send it back to the user for immediate login
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // Extended token expiration to 7 days
      (err, token) => {
        if (err) throw err;
        // Return both the token and the new user's data
        res.status(201).json({ token, user: newUser });
      }
    );
  } catch (error) {
    // If any error occurs during the transaction, roll back all changes
    await client.query('ROLLBACK');
    console.error('Registration Error:', error.message);
    res.status(500).send('Server error');
  } finally {
    // VERY IMPORTANT: Always release the client back to the pool
    client.release();
  }
};

/**
 * @desc    Authenticate an existing user and return a JWT.
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  // 1. Destructure identifier and password from request body
  // CHANGED: From 'email' to 'identifier' to match frontend Login.js
  const { identifier, password } = req.body;

  // 2. Validate input
  if (!identifier || !password) { // CHANGED: From 'email' to 'identifier'
    return res.status(400).json({ message: 'Please provide an email/phone and password.' });
  }

  try {
    // 3. Find the user in the database by their unique identifier (email or phone)
    // NOTE: Assuming 'email' column can store both email and phone for login.
    // If you have a separate 'phone' column, you'd need to adjust this query
    // to check both or have separate login flows. For now, assuming identifier maps to 'email'.
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [identifier]); // CHANGED: Using 'identifier'
    const user = userResult.rows[0];

    // For security, use a generic error message for both wrong identifier and wrong password
    if (!user) { // No user found with that identifier
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 4. Compare the provided password with the securely stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 5. If password is correct, create JWT payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
        school_id: user.school_id, // Ensure school_id is available on the user object
      },
    };

    // Omit the password hash from the user object before sending it back
    delete user.password_hash;

    // 6. Sign the token and send it back with the user data
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // Consistent 7-day expiration
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, user });
      }
    );
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).send('Server error.');
  }
};


// --- MODULE EXPORTS ---
// Export the functions to be used in the route files
module.exports = {
  register,
  login,
};
