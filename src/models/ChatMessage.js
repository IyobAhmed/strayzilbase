const mongoose = require('mongoose');
const chatMessageSchema = new mongoose.Schema({
  channel: { type: String, enum: ['global','general','mods','help','offtopic'], default: 'global' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPrivate: { type: Boolean, default: false },
  content: { type: String, required: true, maxlength: 1000 },
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  deletedAt: { type: Date, default: null },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null }
}, { timestamps: true });
module.exports = mongoose.model('ChatMessage', chatMessageSchema);
