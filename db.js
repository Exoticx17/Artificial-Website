const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'xartificialpr',
  password: 'cc1ss7abcX',
  port: 5432,
});

module.exports = pool;
