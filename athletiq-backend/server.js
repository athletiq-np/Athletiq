// Load environment variables from the .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Import the new middleware
const { errorHandler } = require('./src/middlewares/errorHandler');

// --- Initialize Express App ---
const app = express();

// --- Core Middleware ---
app.use(cors({
  // This allows your frontend (running on a different port)
  // to receive cookies from the backend.
  origin: 'http://localhost:3000', // Replace with your frontend URL in production
  credentials: true,
}));

app.use(express.json()); // To parse JSON request bodies
app.use(cookieParser()); // Use cookie-parser middleware

// --- API Routes ---
app.get('/', (req, res) => res.send('Athletiq API is running...'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/schools', require('./src/routes/schoolRoutes'));
app.use('/api/players', require('./src/routes/playerRoutes'));
app.use('/api/tournaments', require('./src/routes/tournamentRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// --- Error Handling Middleware ---
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));