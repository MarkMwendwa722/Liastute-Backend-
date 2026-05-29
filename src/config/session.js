const session = require('express-session');
const ConnectPgSimple = require('connect-pg-simple')(session);
const { Pool } = require('pg');

const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'liastute_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };

if (useSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pgPool = new Pool(poolConfig);

const sessionConfig = {
  store: new ConnectPgSimple({
    pool: pgPool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'change_this_session_secret',
  resave: false,
  saveUninitialized: false,
  name: 'liastute.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

module.exports = sessionConfig;
