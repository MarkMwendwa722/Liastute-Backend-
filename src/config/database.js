const { Sequelize } = require('sequelize');

// ─── Database credentials ───────────────────────────────────────────────────
const DB_NAME     = 'liastute_db';
const DB_USER     = 'liastute_db_user';
const DB_PASSWORD = 'I6fr7tw1qrdBSuqzHWEO9J6FuuNGjHSE';
const DB_HOST     = 'dpg-d8cko5gg4nts738pdscg-a';
const DB_PORT     = 5432;
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
