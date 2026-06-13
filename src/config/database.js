const { Sequelize } = require("sequelize");

//
// ─── Database config ──────────────────────────────────────────────────────────
// Credentials for the Render-hosted PostgreSQL instance.
// Use the External Host when running locally; the Internal Host when deployed on Render.
const DB_CONFIG = {
  name: "liastute_db",
  user: "liastute_db_user",
  password: process.env.DB_PASSWORD,
  // Hostname only — NOT the full connection URL.
  // e.g. dpg-xxxx.oregon-postgres.render.com  (external, for local dev)
  //   or dpg-xxxx-a                            (internal, for Render-hosted backend)
  host:
    process.env.DB_HOST ||
    "dpg-d8cko5gg4nts738pdscg-a.oregon-postgres.render.com",
  port: 5432,
};
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production";

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: isProduction ? false : console.log,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    })
  : new Sequelize(DB_CONFIG.name, DB_CONFIG.user, DB_CONFIG.password, {
      dialect: "postgres",
      logging: isProduction ? false : console.log,
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    });

module.exports = sequelize;
