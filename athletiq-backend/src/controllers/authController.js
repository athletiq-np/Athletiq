const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user (player, coach, referee, org, super_admin)
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || !role)
      return res.status(400).json({ message: 'All fields required.' });

    // Duplicate email check
    const exists = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (exists.rows.length)
      return res.status(409).json({ message: 'Email already registered.' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    await pool.query(
      'INSERT INTO users (full_name, email, password, role, is_active, created_at) VALUES ($1,$2,$3,$4,TRUE,NOW())',
      [fullName, email, hashed, role]
    );

    res.status(201).json({ message: 'Registered! You can login now.' });
  } catch (err) {
    console.error('User registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login for all roles
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required.' });

    const userRes = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!userRes.rows.length)
      return res.status(401).json({ message: 'No user found with this email.' });

    const user = userRes.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Invalid password.' });

    // JWT token includes id, role
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
