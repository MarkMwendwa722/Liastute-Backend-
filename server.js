// dotenv removed
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models — use { alter: true } in dev, migrations in production
    // Always sync in dev
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
