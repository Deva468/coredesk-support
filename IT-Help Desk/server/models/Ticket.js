const mongoose = require("mongoose");

const HistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: "" },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String, default: "" },
}, { _id: false });

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true },
  department: { type: String, required: true, trim: true },
  requestType: { type: String, required: true, trim: true, default: "General support" },
  title: { type: String, required: true, trim: true, maxlength: 200, default: "Support request" },
  issue: { type: String, required: true, trim: true, maxlength: 5000 },
  priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
  status: { type: String, enum: ["Open", "Resolved", "Removed"], default: "Open", index: true },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date, default: null },
  removedAt: { type: Date, default: null },
  resolutionNote: { type: String, default: null },
  resolver: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  resolverName: { type: String, default: null },
  resolverEmail: { type: String, default: null },
  remover: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  removerName: { type: String, default: null },
  removerEmail: { type: String, default: null },
  history: { type: [HistorySchema], default: [] },
});

module.exports = mongoose.model("Ticket", TicketSchema);
