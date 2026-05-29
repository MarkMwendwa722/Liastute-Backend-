const session = require('express-session');
const ConnectPgSimple = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const pgPool = new Pool({
  host: 'dpg-d8cko5gg4nts738pdscg-a',
  port: 5432,
  database: 'liastute_db',
  user: 'liastute_db_user',
  password: 'I6fr7tw1qrdBSuqzHWEO9J6FuuNGjHSE',
});

const sessionConfig = {
  store: new ConnectPgSimple({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  name: 'liastute.sid',
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
};

module.exports = sessionConfig;
