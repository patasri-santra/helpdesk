const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorRole: { type: String, enum: ['USER', 'ADMIN'], required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

commentSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
