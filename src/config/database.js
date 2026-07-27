const mongoose = require("mongoose");

const MONGO_URI =
  "mongodb://maxmark722_db_user:88f1zeeaNMn7Vp2f@ac-nalotlj-shard-00-00.fmjkgz3.mongodb.net:27017/liastute_db?ssl=true&authSource=admin&retryWrites=true&w=majority";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connection established.");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectDB;
