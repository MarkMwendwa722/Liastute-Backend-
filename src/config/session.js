const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const MONGO_URI =
  "mongodb://maxmark722_db_user:88f1zeeaNMn7Vp2f@ac-nalotlj-shard-00-00.fmjkgz3.mongodb.net:27017/liastute_db?ssl=true&authSource=admin&retryWrites=true&w=majority";

const sessionConfig = {
  store: new MongoStore({
    mongoUrl: MONGO_URI,
    collectionName: "sessions",
    ttl: 60 * 60 * 24 * 7, // 7 days
    autoRemove: "native",
  }),
  secret: process.env.SESSION_SECRET || "change_this_session_secret",
  resave: false,
  saveUninitialized: false,
  name: "liastute.sid",
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

module.exports = sessionConfig;
