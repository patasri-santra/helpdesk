const mongoose = require('mongoose');

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const CATEGORIES = ['BUG', 'BILLING', 'ACCOUNT', 'FEATURE_REQUEST', 'GENERAL'];

const ticketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, default: 'GENERAL' },
    priority: { type: String, enum: PRIORITIES, default: 'MEDIUM' },
    status: { type: String, enum: STATUSES, default: 'OPEN' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

ticketSchema.index({ createdBy: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ title: 'text', description: 'text' });

const Ticket = mongoose.model('Ticket', ticketSchema);
Object.assign(Ticket, { STATUSES, PRIORITIES, CATEGORIES });
module.exports = Ticket;
