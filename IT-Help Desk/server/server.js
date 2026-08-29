require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const Ticket = require("./models/Ticket");
const User = require("./models/User");
const Notification = require("./models/Notification");
const Activity = require("./models/Activity");

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const JWT_SECRET = process.env.JWT_SECRET || "development-only-change-this-secret";
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;
let isMongoConnected = false;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function filePath(name) { return path.join(DATA_DIR, name); }
function readFile(name) { const target = filePath(name); if (!fs.existsSync(target)) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(target, "[]"); } return JSON.parse(fs.readFileSync(target, "utf8")); }
function writeFile(name, value) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2)); }
function publicUser(user) { return { id: String(user._id), name: user.name, email: user.email, department: user.department, role: user.role, createdAt: user.createdAt, lastLoginAt: user.lastLoginAt, lastLogoutAt: user.lastLogoutAt, isActive: user.isActive }; }
function signToken(user) { return jwt.sign({ sub: String(user._id), role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "8h" }); }
function validateCredentials({ email, password }) { return typeof email === "string" && email.includes("@") && typeof password === "string" && password.length >= 8; }
async function logActivity(user, action, details = {}) { if (isMongoConnected && user?._id) await Activity.create({ userId: String(user._id), email: user.email, action, details }); }

async function findUserByEmail(email) { if (isMongoConnected) return User.findOne({ email: email.toLowerCase() }); return readFile("users.json").find((user) => user.email === email.toLowerCase()) || null; }
async function saveUser(user) { if (isMongoConnected) return new User(user).save(); const users = readFile("users.json"); const saved = { _id: user._id || `${Date.now()}`, createdAt: user.createdAt || new Date().toISOString(), ...user }; users.push(saved); writeFile("users.json", users); return saved; }
async function getUserById(id) { if (isMongoConnected) return User.findById(id); return readFile("users.json").find((user) => String(user._id) === String(id)) || null; }
async function updateUserLogin(user, method = "password") { const loginAt = new Date().toISOString(); if (isMongoConnected) { user.lastLoginAt = loginAt; user.loginHistory = [...(user.loginHistory || []), { loggedInAt: loginAt, method }].slice(-20); await user.save(); return user; } const users = readFile("users.json"); const saved = users.find((entry) => String(entry._id) === String(user._id)); if (saved) { saved.lastLoginAt = loginAt; saved.loginHistory = [...(saved.loginHistory || []), { loggedInAt: loginAt, method }].slice(-20); } writeFile("users.json", users); return { ...user, lastLoginAt: loginAt, loginHistory: saved?.loginHistory || [] }; }
async function createUser(data) { if (isMongoConnected) return new User(data).save(); return saveUser(data); }
async function authRequired(req, res, next) { const header = req.headers.authorization || ""; const token = header.startsWith("Bearer ") ? header.slice(7) : null; if (!token) return res.status(401).json({ message: "Authentication required" }); try { const payload = jwt.verify(token, JWT_SECRET); const user = await getUserById(payload.sub); if (!user || user.isActive === false) return res.status(401).json({ message: "User session is no longer active" }); req.user = user; next(); } catch { return res.status(401).json({ message: "Invalid or expired session" }); } }
function adminRequired(req, res, next) { if (req.user.role !== "admin") return res.status(403).json({ message: "Administrator access required" }); next(); }
function ticketRecord(payload, user) { const now = new Date(); return { userId: user._id, name: user.name, email: user.email, department: String(payload.department || "").trim(), requestType: String(payload.requestType || "General support").trim(), title: String(payload.title || payload.issue || "Support request").trim(), issue: String(payload.issue || "").trim(), priority: ["Low", "Medium", "High"].includes(payload.priority) ? payload.priority : "Low", status: "Open", submittedAt: now, updatedAt: now, resolvedAt: null, resolutionNote: null, resolver: null, resolverName: null, resolverEmail: null, history: [{ status: "Open", note: "Request submitted", changedAt: now, changedBy: String(user._id) }] }; }

async function migrateFileDataToMongo() {
  const userCount = await User.countDocuments();

  const fileUsers = readFile("users.json");
  const fileTickets = readFile("tickets.json");
  const fileNotifications = readFile("notifications.json");
  if (!fileUsers.length && !fileTickets.length && !fileNotifications.length) return;

  const userIds = new Map();
  let migratedUsers = 0;
  let migratedTickets = 0;
  let migratedNotifications = 0;
  for (const fileUser of fileUsers) {
    let savedUser = await User.findOne({ email: fileUser.email });
    if (!savedUser && userCount === 0) {
      const userData = { ...fileUser, role: fileUser.role === "admin" ? "admin" : "employee" };
      delete userData._id;
      savedUser = await new User(userData).save();
      migratedUsers += 1;
    }
    if (savedUser) userIds.set(String(fileUser._id), String(savedUser._id));
  }

  const ticketIds = new Map();
  for (const fileTicket of fileTickets) {
    const { _id: oldId, ...ticketData } = fileTicket;
    const existingTicket = await Ticket.findOne({ name: ticketData.name, department: ticketData.department, issue: ticketData.issue });
    if (existingTicket) {
      ticketIds.set(String(oldId), String(existingTicket._id));
      continue;
    }
    const matchingUser = fileUsers.find((fileUser) =>
      (ticketData.email && fileUser.email === ticketData.email) ||
      (ticketData.name && fileUser.name?.toLowerCase() === ticketData.name.toLowerCase())
    ) || fileUsers[0];
    const mongoUser = await User.findOne({
      $or: [{ email: ticketData.email || matchingUser?.email }, { name: ticketData.name || matchingUser?.name }],
    });
    ticketData.userId = userIds.get(String(ticketData.userId)) || userIds.get(String(matchingUser?._id)) || "legacy-import";
    ticketData.userId = mongoUser?._id || matchingUser?._id && userIds.get(String(matchingUser._id));
    if (!ticketData.userId || !mongoose.isValidObjectId(ticketData.userId)) continue;
    ticketData.email = ticketData.email || matchingUser?.email || "legacy-import@local.invalid";
    ticketData.name = ticketData.name || matchingUser?.name || "Imported user";
    const savedTicket = await new Ticket(ticketData).save();
    ticketIds.set(String(oldId), String(savedTicket._id));
    migratedTickets += 1;
  }

  for (const fileNotification of fileNotifications) {
    const notificationData = { ...fileNotification };
    delete notificationData._id;
    notificationData.userId = userIds.get(String(notificationData.userId)) || String(notificationData.userId);
    notificationData.ticketId = ticketIds.get(String(notificationData.ticketId)) || notificationData.ticketId;
    await new Notification(notificationData).save();
    migratedNotifications += 1;
  }

  if (migratedUsers || migratedTickets || migratedNotifications) console.log(`Migrated ${migratedUsers} users, ${migratedTickets} tickets, and ${migratedNotifications} notifications from file storage to MongoDB`);
}

async function backfillLoginActivities() {
  if (await Activity.countDocuments()) return;
  const users = await User.find().select("email loginHistory").lean();
  const activities = users.flatMap((user) => (user.loginHistory || []).map((login) => ({
    userId: user._id,
    email: user.email,
    action: "login",
    details: { method: login.method || "password", migrated: true },
    createdAt: login.loggedInAt || new Date(),
  })));
  if (activities.length) await Activity.insertMany(activities);
}

async function repairLegacyTickets() {
  const users = await User.find().lean();
  const tickets = await Ticket.find({ $or: [{ userId: { $exists: false } }, { requestType: { $exists: false } }, { title: { $exists: false } }, { submittedAt: { $exists: false } }, { updatedAt: { $exists: false } }] });
  for (const ticket of tickets) {
    const user = users.find((entry) =>
      (ticket.email && entry.email === ticket.email) ||
      (ticket.name && entry.name?.toLowerCase() === ticket.name.toLowerCase())
    );
    const updates = {
      requestType: ticket.requestType || "General support",
      title: ticket.title || ticket.issue || "Support request",
      submittedAt: ticket.submittedAt || new Date(),
      updatedAt: ticket.updatedAt || ticket.submittedAt || new Date(),
    };
    if (!ticket.userId && user) {
      updates.userId = user._id;
      updates.name = ticket.name || user.name;
      updates.email = ticket.email || user.email;
    }
    if (updates.userId || user) await Ticket.updateOne({ _id: ticket._id }, { $set: updates });
  }
}

app.get("/health", (req, res) => res.json({ status: "ok", storage: isMongoConnected ? "mongo" : "file" }));

app.post("/auth/signup", async (req, res) => { const { name, email, password, department } = req.body || {}; if (!name || !validateCredentials({ email, password })) return res.status(400).json({ message: "Name, valid email, and a password of at least 8 characters are required" }); if (await findUserByEmail(email)) return res.status(409).json({ message: "An account with this email already exists" }); const user = await createUser({ name: name.trim(), email: email.toLowerCase().trim(), department: String(department || "General").trim(), passwordHash: await bcrypt.hash(password, 12), role: "employee", lastLoginAt: new Date(), isActive: true }); await logActivity(user, "signup", { role: "employee" }); res.status(201).json({ user: publicUser(user), token: signToken(user) }); });

app.post("/auth/login", async (req, res) => { const { email, password } = req.body || {}; const user = email ? await findUserByEmail(email) : null; if (!user || !user.passwordHash || !(await bcrypt.compare(password || "", user.passwordHash))) return res.status(401).json({ message: "Invalid email or password" }); const updated = await updateUserLogin(user); if (isMongoConnected) { updated.isActive = true; updated.lastLogoutAt = null; await updated.save(); } await logActivity(updated, "login", { method: "password" }); res.json({ user: publicUser(updated), token: signToken(updated) }); });

app.post("/auth/google", async (req, res) => { if (!googleClient) return res.status(503).json({ message: "Google login is not configured" }); try { const ticket = await googleClient.verifyIdToken({ idToken: req.body?.credential, audience: process.env.GOOGLE_CLIENT_ID }); const payload = ticket.getPayload(); if (!payload?.email || !payload.email_verified) return res.status(401).json({ message: "Verified Google email required" }); let user = await findUserByEmail(payload.email); if (!user) user = await createUser({ name: payload.name || payload.email.split("@")[0], email: payload.email.toLowerCase(), googleId: payload.sub, role: "employee", lastLoginAt: new Date(), isActive: true }); else { user = await updateUserLogin(user); user.isActive = true; user.lastLogoutAt = null; await user.save(); } await logActivity(user, "login", { method: "google" }); res.json({ user: publicUser(user), token: signToken(user) }); } catch { res.status(401).json({ message: "Google sign-in could not be verified" }); } });

app.get("/auth/me", authRequired, (req, res) => res.json({ user: publicUser(req.user), loginHistory: req.user.loginHistory || [] }));
app.post("/auth/logout", authRequired, async (req, res) => { if (isMongoConnected) { req.user.isActive = false; req.user.lastLogoutAt = new Date(); await req.user.save(); } await logActivity(req.user, "logout"); res.json({ message: "Logged out" }); });

app.patch("/auth/profile", authRequired, async (req, res) => { const name = String(req.body?.name || "").trim(); if (name.length < 2) return res.status(400).json({ message: "Name must contain at least 2 characters" }); if (isMongoConnected) { req.user.name = name; await req.user.save(); await logActivity(req.user, "profile_updated"); return res.json({ user: publicUser(req.user) }); } const users = readFile("users.json"); const saved = users.find((user) => String(user._id) === String(req.user._id)); if (!saved) return res.status(404).json({ message: "User not found" }); saved.name = name; writeFile("users.json", users); res.json({ user: publicUser({ ...req.user, name }) }); });

app.post("/auth/password", authRequired, async (req, res) => { const { currentPassword, newPassword } = req.body || {}; if (!req.user.passwordHash || !(await bcrypt.compare(currentPassword || "", req.user.passwordHash))) return res.status(401).json({ message: "Current password is incorrect" }); if (typeof newPassword !== "string" || newPassword.length < 8) return res.status(400).json({ message: "New password must contain at least 8 characters" }); const passwordHash = await bcrypt.hash(newPassword, 12); if (isMongoConnected) { req.user.passwordHash = passwordHash; await req.user.save(); await logActivity(req.user, "password_changed"); } else { const users = readFile("users.json"); const saved = users.find((user) => String(user._id) === String(req.user._id)); if (saved) saved.passwordHash = passwordHash; writeFile("users.json", users); } res.json({ message: "Password updated" }); });

app.get("/tickets", authRequired, async (req, res) => { const tickets = isMongoConnected ? await Ticket.find(req.user.role === "admin" ? {} : { userId: req.user._id, status: "Open" }).populate("userId", "name email department role").populate("resolver", "name email").populate("remover", "name email").populate("assignedTo", "name email").sort({ submittedAt: -1 }) : readFile("tickets.json").filter((ticket) => ticket.status === "Open" && (req.user.role === "admin" || ticket.userId === String(req.user._id))); res.json(tickets); });
app.get("/admin/tickets/:id", authRequired, adminRequired, async (req, res) => { if (!isMongoConnected) return res.status(503).json({ message: "MongoDB is unavailable" }); try { const ticket = await Ticket.findById(req.params.id).populate("userId", "name email department role").populate("resolver", "name email").populate("remover", "name email").populate("assignedTo", "name email"); if (!ticket) return res.status(404).json({ message: "Request not found" }); res.json({ ticket }); } catch (error) { if (error.name === "CastError") return res.status(400).json({ message: "Invalid request ID" }); throw error; } });
app.get("/admin/activity", authRequired, async (req, res) => {
  if (!isMongoConnected) return res.json([]);
  const activities = await Activity.find().populate("userId", "name email department role").sort({ createdAt: -1 }).limit(200).lean();
  res.json(activities);
});
app.get("/admin/users", authRequired, adminRequired, async (req, res) => {
  if (isMongoConnected) {
    const users = await User.find().select("name email department role createdAt lastLoginAt lastLogoutAt isActive").sort({ createdAt: -1 }).lean();
    return res.json({ count: users.length, users });
  }
  const users = readFile("users.json");
  res.json({ count: users.length, users });
});
app.patch("/admin/users/:id/promote", authRequired, adminRequired, async (req, res) => {
  if (!isMongoConnected) {
    const users = readFile("users.json");
    const userToPromote = users.find((user) => String(user._id) === String(req.params.id));
    if (!userToPromote) return res.status(404).json({ message: "User not found" });
    if (userToPromote.role === "admin") return res.json({ user: publicUser(userToPromote), message: "User is already an admin" });
    userToPromote.role = "admin";
    writeFile("users.json", users);
    return res.json({ user: publicUser(userToPromote), message: "User promoted to admin" });
  }
  try {
    const userToPromote = await User.findById(req.params.id);
    if (!userToPromote) return res.status(404).json({ message: "User not found" });
    if (userToPromote.role === "admin") return res.json({ user: publicUser(userToPromote), message: "User is already an admin" });
    userToPromote.role = "admin";
    await userToPromote.save();
    await logActivity(req.user, "user_promoted", { targetUserId: String(userToPromote._id), targetEmail: userToPromote.email });
    res.json({ user: publicUser(userToPromote), message: "User promoted to admin" });
  } catch (error) {
    if (error.name === "CastError") return res.status(400).json({ message: "Invalid user ID" });
    console.error("User promotion failed:", error);
    res.status(500).json({ message: "The user could not be promoted" });
  }
});

app.post("/tickets", authRequired, async (req, res) => { if (!req.body?.department || !req.body?.issue) return res.status(400).json({ message: "Department and issue description are required" }); if (!isMongoConnected) return res.status(503).json({ message: "MongoDB is unavailable. The request was not saved." }); try { const saved = await new Ticket(ticketRecord(req.body, req.user)).save(); await logActivity(req.user, "ticket_created", { ticketId: String(saved._id) }); return res.status(201).json({ ticket: saved }); } catch (error) { console.error("Ticket save failed:", error); return res.status(500).json({ message: "The request could not be saved to MongoDB" }); } });

app.delete("/tickets/:id", authRequired, adminRequired, async (req, res) => { if (!isMongoConnected) return res.status(503).json({ message: "MongoDB is unavailable. The request was not removed." }); try { const ticket = await Ticket.findById(req.params.id); if (!ticket) return res.status(404).json({ message: "Request not found" }); if (ticket.status !== "Open") return res.status(409).json({ message: "Only open requests can be removed" }); const removedAt = new Date(); ticket.status = "Removed"; ticket.updatedAt = removedAt; ticket.removedAt = removedAt; ticket.remover = req.user._id; ticket.removerName = req.user.name; ticket.removerEmail = req.user.email; ticket.history.push({ status: "Removed", note: "Request removed from the active queue", changedAt: removedAt, changedBy: String(req.user._id) }); await ticket.save(); await logActivity(req.user, "ticket_removed", { ticketId: String(ticket._id), issue: ticket.issue, removedAt }); return res.json({ message: "Request removed from the active queue", ticket }); } catch (error) { if (error.name === "CastError") return res.status(400).json({ message: "Invalid request ID" }); console.error("Ticket removal failed:", error); return res.status(500).json({ message: "The request could not be removed from MongoDB" }); } });

app.patch("/admin/tickets/:id/assign", authRequired, adminRequired, async (req, res) => {
  const resolverId = String(req.body?.resolverId || "");
  if (!resolverId) return res.status(400).json({ message: "A valid resolver ID is required" });
  if (!isMongoConnected) {
    const users = readFile("users.json");
    const resolver = users.find((u) => String(u._id) === resolverId && u.role === "admin");
    if (!resolver) return res.status(404).json({ message: "Resolver not found" });
    const tickets = readFile("tickets.json");
    const ticket = tickets.find((t) => String(t._id) === String(req.params.id));
    if (!ticket) return res.status(404).json({ message: "Request not found" });
    ticket.assignedTo = resolver._id;
    ticket.assignedToName = resolver.name;
    ticket.assignedToEmail = resolver.email;
    ticket.updatedAt = new Date().toISOString();
    ticket.history = ticket.history || [];
    ticket.history.push({ status: ticket.status || "Open", note: `Assigned to ${resolver.name}`, changedAt: ticket.updatedAt, changedBy: String(req.user._id) });
    writeFile("tickets.json", tickets);
    return res.json({ ticket });
  }
  if (!mongoose.isValidObjectId(resolverId)) return res.status(400).json({ message: "A valid resolver ID is required" });
  const resolver = await User.findOne({ _id: resolverId, role: "admin" });
  if (!resolver) return res.status(404).json({ message: "Resolver not found" });
  const assignedAt = new Date();
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, {
    assignedTo: resolver._id,
    assignedToName: resolver.name,
    assignedToEmail: resolver.email,
    updatedAt: assignedAt,
    $push: { history: { status: "Open", note: `Assigned to ${resolver.name}`, changedAt: assignedAt, changedBy: String(req.user._id) } }
  }, { new: true }).populate("assignedTo", "name email");
  if (!ticket) return res.status(404).json({ message: "Request not found" });
  await logActivity(req.user, "ticket_assigned", { ticketId: String(ticket._id), resolverId: String(resolver._id) });
  res.json({ ticket });
});

app.patch("/tickets/:id/resolve", authRequired, adminRequired, async (req, res) => { const note = String(req.body?.resolutionNote || "Resolved by the support team").trim(); if (isMongoConnected) { const resolvedAt = new Date(); const ticket = await Ticket.findOneAndUpdate({ _id: req.params.id, status: "Open" }, { status: "Resolved", updatedAt: resolvedAt, resolvedAt, resolutionNote: note, resolver: req.user._id, resolverName: req.user.name, resolverEmail: req.user.email, $push: { history: { status: "Resolved", note, changedAt: resolvedAt, changedBy: String(req.user._id) } } }, { new: true }); if (!ticket) return res.status(404).json({ message: "Open request not found" }); await Notification.create({ userId: ticket.userId, ticketId: String(ticket._id), message: `Your request "${ticket.issue}" has been resolved.` }); await logActivity(req.user, "ticket_resolved", { ticketId: String(ticket._id), resolutionNote: note, resolverId: String(req.user._id), resolverName: req.user.name, resolverEmail: req.user.email, resolvedAt }); return res.json({ ticket }); } const tickets = readFile("tickets.json"); const ticket = tickets.find((entry) => String(entry._id) === String(req.params.id)); if (!ticket) return res.status(404).json({ message: "Request not found" }); ticket.status = "Resolved"; ticket.resolvedAt = new Date().toISOString(); ticket.resolutionNote = note; ticket.resolver = req.user._id; ticket.resolverName = req.user.name; ticket.resolverEmail = req.user.email; ticket.history = [...(ticket.history || []), { status: "Resolved", note, changedAt: ticket.resolvedAt, changedBy: String(req.user._id) }]; writeFile("tickets.json", tickets); const notifications = readFile("notifications.json"); notifications.unshift({ _id: `${Date.now()}`, userId: ticket.userId, ticketId: ticket._id, message: `Your request "${ticket.issue}" has been resolved.`, read: false, createdAt: new Date().toISOString() }); writeFile("notifications.json", notifications); res.json({ ticket }); });

app.get("/notifications", authRequired, async (req, res) => res.json(isMongoConnected ? await Notification.find({ userId: String(req.user._id) }).sort({ createdAt: -1 }) : readFile("notifications.json").filter((item) => item.userId === String(req.user._id))));

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri || mongoUri.includes("...")) {
    throw new Error("MONGO_URI is missing or still uses a placeholder");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000
  });

  isMongoConnected = true;
  console.log("MongoDB Connected");
  await User.updateMany({ role: "user" }, { $set: { role: "employee" } });
}

connectToDatabase().then(async () => {
  if (isMongoConnected) await migrateFileDataToMongo();
  if (isMongoConnected) await backfillLoginActivities();
  if (isMongoConnected) await repairLegacyTickets();

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const configuredAdmin = await findUserByEmail(process.env.ADMIN_EMAIL);
    if (!configuredAdmin) await createUser({ name: process.env.ADMIN_NAME || "System administrator", email: process.env.ADMIN_EMAIL.toLowerCase(), passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: "admin", lastLoginAt: null, isActive: false });
    else if (isMongoConnected && configuredAdmin.role !== "admin") { configuredAdmin.role = "admin"; await configuredAdmin.save(); }
  }

  app.listen(PORT, () =>
    console.log(`Server Running on Port ${PORT}`)
  );
}).catch((error) => {
  console.error("Server startup failed because MongoDB is unavailable:", error.message);
  process.exitCode = 1;
});