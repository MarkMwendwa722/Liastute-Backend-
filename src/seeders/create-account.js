// One-off script to create a user account.
// Mirrors the logic in src/controllers/authController.js (register).
const bcrypt = require("bcryptjs");
const connectDB = require("../config/database");
const { User } = require("../models");

const account = {
  firstName: "Mark",
  lastName: "Mwendwa",
  email: "mark@lijustore.co.ke",
  password: "2580_Mark",
  phone: "+254725707665",
  role: "admin",
};

(async () => {
  await connectDB();

  const email = account.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = account.role || existing.role;
    await existing.save();
    console.log("Account already existed — role updated to:", existing.role);
    console.log({ id: existing.id, email: existing.email, role: existing.role, isActive: existing.isActive });
    process.exit(0);
  }

  const hashed = await bcrypt.hash(account.password, 12);
  const user = await User.create({
    firstName: account.firstName,
    lastName: account.lastName,
    email,
    password: hashed,
    phone: account.phone,
    role: account.role || "customer",
  });

  console.log("Account created successfully:");
  console.log({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  });
  process.exit(0);
})().catch((err) => {
  console.error("Failed to create account:", err.message);
  process.exit(1);
});
