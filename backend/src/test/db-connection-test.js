const { Pool } = require('pg');

const pool = new Pool({
  user: 'sddev',
  host: 'localhost',
  database: 'sheepduckchess',
  password: '123',
  port: 5432,
});

pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('쿼리 실패:', err);
  } else {
    console.log('쿼리 결과:', result.rows);
  }
  pool.end();
});
