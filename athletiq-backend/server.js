require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// Add this line right after your route registrations
console.log('✅ Auth routes registered at /api/auth');
app.use('/api/auth', require('./src/routes/authRoutes'));

// --- API Routes ---
app.get('/', (req, res) => res.send('Athletiq API is running...'));

app.use('/api/schools', require('./src/routes/schoolRoutes'));
app.use('/api/players', require('./src/routes/playerRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// --- Error Handling Middleware ---
app.use(errorHandler);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));