const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  department: { type: String, default: "General", trim: true },
  passwordHash: { type: String, default: null },
  googleId: { type: String, default: null },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  lastLoginAt: { type: Date, default: null },
  lastLogoutAt: { type: Date, default: null },
  isActive: { type: Boolean, default: false, index: true },
  loginHistory: { type: [{ loggedInAt: Date, method: String }], default: [] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
