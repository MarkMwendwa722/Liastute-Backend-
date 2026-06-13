require("dotenv").config();
const app = require("./src/app");
const { sequelize } = require("./src/models");

const PORT = process.env.PORT || 5000;

const logDatabaseStartupError = (err) => {
  if (err && err.name === "SequelizeHostNotFoundError") {
    console.error(
      "Database host was not found. If you are running locally with a Render database, use Render's External Database URL in DATABASE_URL. The Internal Database URL only works from inside Render.",
    );
  }

  if (err && err.name === "SequelizeConnectionRefusedError") {
    console.error(
      "Database connection was refused. Start your local Postgres server, or set DATABASE_URL in .env to a reachable Postgres database.",
    );
  }

  console.error("Failed to start server:", err);
};

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established.");

    await sequelize.sync({ alter: true });
    console.log("Database synced.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logDatabaseStartupError(err);
    process.exit(1);
  }
};

// On Vercel the module is imported by the serverless runtime — don't call listen().
// Locally (node server.js / nodemon), start the HTTP server normally.
if (require.main === module) {
  start();
} else {
  // Vercel: connect to DB lazily on first request instead of at cold-start
  sequelize
    .authenticate()
    .then(() => sequelize.sync({ alter: false }))
    .catch((err) => {
      logDatabaseStartupError(err);
    });
}

module.exports = app;
