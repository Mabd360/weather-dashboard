const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('WARNING: DATABASE_URL is not defined in the environment variables.');
}

const pool = new Pool({
  connectionString: connectionString,
  // If running on services like Render/Heroku, SSL might be required.
  // We can add a fallback or let it connect normally.
  ssl: connectionString && (connectionString.includes('localhost') || connectionString.includes('127.0.0.1'))
    ? false
    : { rejectUnauthorized: false }
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
