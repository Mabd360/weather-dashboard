const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const weatherRoutes = require('./routes/weatherRoutes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:5000', 'http://localhost:3000', 'http://127.0.0.1:5500', 'http://127.0.0.1:5000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    }
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'));
  }
}));
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', weatherRoutes);

// Optional: compatibility fallback if frontend calls '/' instead of '/api'
// Let's mount on both /api and / to be compatible with both requirements:
// Route requests: GET /weather/:city, POST /save-weather, GET /history, DELETE /history/:id
app.use('/', weatherRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the application.`);
  
  // Verify database connection at startup
  try {
    await db.query('SELECT NOW()');
    console.log('Database connection verification: SUCCESS');
  } catch (err) {
    console.error('Database connection verification: FAILED');
    console.error('Please make sure PostgreSQL is running and DATABASE_URL in backend/.env is correct.');
    console.error(err.message);
  }
});
