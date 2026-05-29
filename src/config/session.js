const session = require('express-session');
const ConnectPgSimple = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const pgPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'liastute_db',
  user: 'postgres',
  password: '258096',
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
