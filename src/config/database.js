const { Sequelize } = require('sequelize');

// ─── Database credentials ───────────────────────────────────────────────────
const DB_NAME     = 'liastute_db';
const DB_USER     = 'postgres';
const DB_PASSWORD = '258096'; // ← put your password here
const DB_HOST     = 'localhost';
const DB_PORT     = 5722;
// ────────────────────────────────────────────────────────────────────────────

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
