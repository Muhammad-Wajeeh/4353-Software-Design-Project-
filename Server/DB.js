// Server/DB.js
const { Pool } = require("pg");
require("dotenv").config();

// Create connection pool to Railway
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Railway public access
  },
});

// Optional helper to simplify queries
const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
