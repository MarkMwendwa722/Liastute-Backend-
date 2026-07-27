require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");
const connectDB = require("./src/config/database");

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

// On Vercel the module is imported by the serverless runtime — don't call listen().
// Locally (node server.js / nodemon), start the HTTP server normally.
if (require.main === module) {
  start();
} else {
  // Vercel: connect to DB lazily on first request
  connectDB().catch((err) => {
    console.error("Failed to connect to database:", err.message);
  });
}

module.exports = app;
