const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.connect()
  .then(async () => {
    console.log('✅ Database connected!');
    
    // ONE-TIME RESET: Drop and recreate to fix schema mess
    // WARNING: This deletes all existing users.
    await pool.query('DROP TABLE IF EXISTS users CASCADE');

    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables reset and created!');
  })
  .catch(err => console.error('❌ DB connection error:', err));

module.exports = pool;